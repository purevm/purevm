import assert from "node:assert/strict";
import { describe, test } from "vitest";

import {
    RpcAbortError,
    RpcProviderError,
    RpcSerializationError,
    RpcWebSocketClient,
    WebSocketTransport,
    type WebSocketLike,
} from "../src/clients/websocket/OLD/index.js";
import {
    BlockSourceManager,
    NewHeadsStreaming,
    type BlockHeader,
    type BlockSource,
    type RpcHead,
} from "../src/modules/newHeads/index.js";

// ===========================================================
// Types
// ===========================================================

type Listener = (event: any) => void;

// ===========================================================
// Classes
// ===========================================================

class FakeWebSocket implements WebSocketLike {
    public static readonly CONNECTING = 0;
    public static readonly OPEN = 1;
    public static readonly CLOSING = 2;
    public static readonly CLOSED = 3;
    public static readonly instances: FakeWebSocket[] = [];

    public readyState: number = WebSocket.CONNECTING;
    public readonly sent: string[] = [];
    private readonly _listeners = new Map<string, Set<Listener>>();

    // ==========================
    // Constructor
    // ==========================

    constructor(_url?: string) {
        FakeWebSocket.instances.push(this);
    }

    // ==========================
    // Public API
    // ==========================

    public addEventListener(type: "open", listener: (event: Event) => void): void;
    public addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
    public addEventListener(type: "close", listener: (event: CloseEvent) => void): void;
    public addEventListener(type: "error", listener: (event: Event) => void): void;
    public addEventListener(type: string, listener: Listener): void {
        const listeners = this._listeners.get(type) ?? new Set<Listener>();
        listeners.add(listener);
        this._listeners.set(type, listeners);
    }

    public removeEventListener(type: "open", listener: (event: Event) => void): void;
    public removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
    public removeEventListener(type: "close", listener: (event: CloseEvent) => void): void;
    public removeEventListener(type: "error", listener: (event: Event) => void): void;
    public removeEventListener(type: string, listener: Listener): void {
        this._listeners.get(type)?.delete(listener);
    }

    public send(raw: string): void {
        if (this.readyState !== WebSocket.OPEN) {
            throw new Error("Fake socket is not open");
        }
        this.sent.push(raw);
    }

    public close(code = 1000, reason = ""): void {
        if (this.readyState === WebSocket.CLOSED) {
            return;
        }
        this.readyState = WebSocket.CLOSED;
        this._emit("close", { code, reason, wasClean: true } as CloseEvent);
    }

    public open(): void {
        this.readyState = WebSocket.OPEN;
        this._emit("open", {} as Event);
    }

    public fail(): void {
        this._emit(
            "error",
            { error: new Error("socket failed") } as unknown as Event,
        );
    }

    public message(value: unknown): void {
        this._emit("message", {
            data: typeof value === "string" ? value : JSON.stringify(value),
        } as MessageEvent);
    }

    // ==========================
    // Private Methods
    // ==========================

    private _emit(type: string, event: Event | MessageEvent | CloseEvent): void {
        for (const listener of this._listeners.get(type) ?? []) {
            listener(event);
        }
    }
}

// ===========================================================
// Utilities
// ===========================================================

async function waitFor(assertion: () => void): Promise<void> {
    for (let attempt = 0; attempt < 100; attempt++) {
        try {
            assertion();
            return;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1));
        }
    }
    assertion();
}

// ===========================================================
// Tests
// ===========================================================

describe("WebSocketTransport", () => {
    test("reconnects while running and never reconnects after stop", async () => {
        const sockets: FakeWebSocket[] = [];
        let reconnects = 0;
        const transport = new WebSocketTransport({
            url: "wss://rpc.example",
            reconnect: { delayMs: 0 },
            createWebSocket: () => {
                const socket = new FakeWebSocket();
                sockets.push(socket);
                return socket;
            },
            onReconnect: () => reconnects++,
        });

        const starting = transport.start();
        sockets[0]!.open();
        await starting;
        assert.equal(transport.isOpen(), true);
        assert.equal(transport.isRunning(), true);

        sockets[0]!.close(1006, "network");
        await waitFor(() => assert.equal(sockets.length, 2));
        sockets[1]!.open();
        await waitFor(() => assert.equal(reconnects, 1));

        transport.stop();
        await new Promise((resolve) => setTimeout(resolve, 5));
        assert.equal(sockets.length, 2);
        assert.equal(transport.isRunning(), false);
    });
});

describe("RpcWebSocketClient", () => {
    test("matches requests and restores its single subscription", async () => {
        const sockets: FakeWebSocket[] = [];
        const values: unknown[] = [];
        const client = new RpcWebSocketClient({
            url: "wss://rpc.example",
            reconnect: { delayMs: 0 },
            requestTimeoutMs: 100,
            createWebSocket: () => {
                const socket = new FakeWebSocket();
                sockets.push(socket);
                return socket;
            },
        });

        const starting = client.start();
        sockets[0]!.open();
        await starting;

        const blockNumber = client.request<string>("eth_blockNumber");
        assert.deepEqual(JSON.parse(sockets[0]!.sent[0]!), {
            id: 1,
            jsonrpc: "2.0",
            method: "eth_blockNumber",
        });
        sockets[0]!.message({ id: 1, jsonrpc: "2.0", result: "0x10" });
        assert.equal(await blockNumber, "0x10");

        const subscribing = client.subscribe(
            ["newHeads"],
            (head) => values.push(head),
            { ackTimeoutMs: 100, resubscribeOnReconnect: true },
        );
        sockets[0]!.message({ id: 2, jsonrpc: "2.0", result: "0xfirst" });
        const subscription = await subscribing;
        assert.equal(client.getSubscriptionId(), "0xfirst");
        await assert.rejects(
            client.subscribe(["logs"], () => undefined),
            /already has a subscription/,
        );

        sockets[0]!.message({
            jsonrpc: "2.0",
            method: "eth_subscription",
            params: {
                subscription: "0xfirst",
                result: { number: "0x10" },
            },
        });
        assert.deepEqual(values, [{ number: "0x10" }]);

        sockets[0]!.close(1006, "network");
        assert.equal(client.getSubscriptionId(), null);
        await waitFor(() => assert.equal(sockets.length, 2));
        sockets[1]!.open();
        await waitFor(() => assert.equal(sockets[1]!.sent.length, 1));
        assert.deepEqual(JSON.parse(sockets[1]!.sent[0]!), {
            id: 3,
            jsonrpc: "2.0",
            method: "eth_subscribe",
            params: ["newHeads"],
        });
        sockets[1]!.message({ id: 3, jsonrpc: "2.0", result: "0xsecond" });
        await waitFor(() => assert.equal(client.getSubscriptionId(), "0xsecond"));
        assert.equal(subscription.getSubscriptionId(), "0xsecond");

        const unsubscribing = subscription.unsubscribe();
        sockets[1]!.message({ id: 4, jsonrpc: "2.0", result: true });
        await unsubscribing;
        sockets[1]!.close(1006, "network");
        await waitFor(() => assert.equal(sockets.length, 3));
        sockets[2]!.open();
        await new Promise((resolve) => setTimeout(resolve, 5));
        assert.equal(sockets[2]!.sent.length, 0);
        client.stop();
    });

    test("uses typed request, provider, and cancellation errors", async () => {
        const socket = new FakeWebSocket();
        const client = new RpcWebSocketClient({
            url: "wss://rpc.example",
            requestTimeoutMs: 100,
            createWebSocket: () => socket,
        });

        const starting = client.start();
        socket.open();
        await starting;

        await assert.rejects(
            client.request("test_serialize", [1n]),
            RpcSerializationError,
        );

        const providerRequest = client.request("test_provider");
        socket.message({
            id: 2,
            jsonrpc: "2.0",
            error: { code: -32000, message: "provider failed" },
        });
        await assert.rejects(providerRequest, RpcProviderError);

        const controller = new AbortController();
        const abortedRequest = client.request(
            "test_abort",
            [],
            { signal: controller.signal },
        );
        controller.abort("cancelled");
        await assert.rejects(abortedRequest, RpcAbortError);
        client.stop();
    });
});

describe("NewHeadsStreaming", () => {
    test("forwards heads and becomes unhealthy when heads stop", async () => {
        const NativeWebSocket = globalThis.WebSocket;
        FakeWebSocket.instances.length = 0;
        globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;

        try {
            const heads: RpcHead[] = [];
            const unhealthy: string[] = [];
            const stream = new NewHeadsStreaming({
                url: "wss://rpc.example",
                reconnect: { delayMs: 0 },
                idleTimeoutMs: 5,
                subscribeAckTimeoutMs: 100,
                onHead: (head) => heads.push(head),
                onUnhealthy: (reason) => unhealthy.push(reason),
                onError: () => undefined,
            });

            const starting = stream.start();
            const socket = FakeWebSocket.instances[0]!;
            socket.open();
            await waitFor(() => assert.equal(socket.sent.length, 1));
            socket.message({ id: 1, jsonrpc: "2.0", result: "0xheads" });
            await starting;

            const head = {
                baseFeePerGas: "0x1",
                difficulty: "0x0",
                extraData: "0x",
                gasLimit: "0x100",
                gasUsed: "0x10",
                hash: "0x10",
                logsBloom: "0x00",
                miner: "0x0000000000000000000000000000000000000000",
                number: "0x1",
                parentHash: "0x09",
                receiptsRoot: "0x01",
                sha3Uncles: "0x02",
                stateRoot: "0x03",
                timestamp: "0x20",
                transactionsRoot: "0x04",
            } satisfies RpcHead;
            socket.message({
                jsonrpc: "2.0",
                method: "eth_subscription",
                params: {
                    subscription: "0xheads",
                    result: head,
                },
            });
            assert.deepEqual(heads, [head]);
            assert.deepEqual(stream.getLastHead(), head);
            assert.equal(stream.isHealthy(), true);

            await waitFor(() => assert.equal(unhealthy.length, 1));
            assert.equal(stream.isHealthy(), false);

            const stopping = stream.stop();
            await waitFor(() => assert.equal(socket.sent.length, 2));
            socket.message({ id: 2, jsonrpc: "2.0", result: true });
            await stopping;
            assert.equal(stream.isRunning(), false);
        } finally {
            globalThis.WebSocket = NativeWebSocket;
            FakeWebSocket.instances.length = 0;
        }
    });
});

describe("BlockSourceManager", () => {
    test("falls back to normalized HTTP heads and returns to WebSocket", async () => {
        const NativeWebSocket = globalThis.WebSocket;
        const nativeFetch = globalThis.fetch;
        FakeWebSocket.instances.length = 0;
        globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;

        const httpBlock = {
            hash: "0x20",
            number: "0x2",
            parentHash: "0x10",
            timestamp: "0x30",
        };
        globalThis.fetch = (async () => ({
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => ({ id: 1, jsonrpc: "2.0", result: httpBlock }),
        })) as unknown as typeof fetch;

        try {
            const received: Array<{
                header: BlockHeader;
                source: BlockSource;
            }> = [];
            const manager = new BlockSourceManager({
                wsUrl: "wss://rpc.example",
                httpUrl: "https://rpc.example",
                reconnect: { delayMs: 0 },
                idleTimeoutMs: 5,
                subscribeAckTimeoutMs: 100,
                fallbackDelayMs: 1,
                wsRestartDelayMs: 100,
                pollingIntervalMs: 100,
                onHead: (header, source) => received.push({ header, source }),
                onError: () => undefined,
            });

            const starting = manager.start();
            const socket = FakeWebSocket.instances[0]!;
            socket.open();
            await waitFor(() => assert.equal(socket.sent.length, 1));
            socket.message({ id: 1, jsonrpc: "2.0", result: "0xheads" });
            await starting;

            const firstHead = {
                baseFeePerGas: "0x1",
                difficulty: "0x0",
                extraData: "0x",
                gasLimit: "0x100",
                gasUsed: "0x10",
                hash: "0x10",
                logsBloom: "0x00",
                miner: "0x0000000000000000000000000000000000000000",
                number: "0x1",
                parentHash: "0x09",
                receiptsRoot: "0x01",
                sha3Uncles: "0x02",
                stateRoot: "0x03",
                timestamp: "0x20",
                transactionsRoot: "0x04",
            } satisfies RpcHead;
            socket.message({
                jsonrpc: "2.0",
                method: "eth_subscription",
                params: { subscription: "0xheads", result: firstHead },
            });
            assert.equal(received[0]!.source, "websocket");
            assert.equal(received[0]!.header.number, 1n);

            await waitFor(() => assert.equal(received.length, 2));
            assert.equal(received[1]!.source, "http");
            assert.equal(received[1]!.header.number, 2n);

            const recoveredHead = {
                ...firstHead,
                hash: "0x30",
                number: "0x3",
                parentHash: "0x20",
                timestamp: "0x40",
            } satisfies RpcHead;
            socket.message({
                jsonrpc: "2.0",
                method: "eth_subscription",
                params: { subscription: "0xheads", result: recoveredHead },
            });
            assert.equal(received[2]!.source, "websocket");
            assert.equal(received[2]!.header.number, 3n);

            const stopping = manager.stop();
            await waitFor(() => assert.equal(socket.sent.length, 2));
            socket.message({ id: 2, jsonrpc: "2.0", result: true });
            await stopping;
            assert.equal(manager.isRunning(), false);
        } finally {
            globalThis.WebSocket = NativeWebSocket;
            globalThis.fetch = nativeFetch;
            FakeWebSocket.instances.length = 0;
        }
    });
});
