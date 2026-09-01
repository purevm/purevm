import {
  createHttpClient,
  createWebSocketClient,
  WebSocketConnectionError,
  type RpcSubscription,
  type WebSocketEvent,
  type WebSocketFactory,
  type WebSocketLike,
  type WebSocketTransportOptions,
} from "@purevm/rpc";

import { HeadState, parseBlockHead } from "./head.js";
import { assertPositiveInteger, LatestBlockPoller, toError } from "./latest-block-poller.js";
import type {
  BlockHead,
  NewHeadsClientFactory,
  NewHeadsOptions,
  NewHeadsWebSocketClient,
  RpcHead,
  RpcLatestBlock,
} from "./types.js";

const defaultClientFactory: NewHeadsClientFactory = {
  createHttp: (options) => createHttpClient(options),
  createWebSocket: (options) => createWebSocketClient(options),
};

export class NewHeads {
  private activeSocketId = 0;
  private heartbeatTimer?: ReturnType<typeof setTimeout>;
  private lifecycleId = 0;
  private nextSocketId = 0;
  private poller?: LatestBlockPoller;
  private reconnectAttempt = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private running = false;
  private readonly state = new HeadState();
  private staleTimer?: ReturnType<typeof setTimeout>;
  private startPromise?: Promise<void>;
  private subscription?: RpcSubscription;
  private websocket?: NewHeadsWebSocketClient;

  constructor(
    private readonly options: NewHeadsOptions,
    private readonly clients: NewHeadsClientFactory = defaultClientFactory,
  ) {
    assertPositiveInteger(options.heartbeat.intervalMs, "Heartbeat interval");
    assertPositiveInteger(options.heartbeat.timeoutMs, "Heartbeat timeout");
    assertNonNegativeInteger(options.polling.delayBeforeStartMs, "Polling delay before start");
    assertPositiveInteger(options.polling.fetchIntervalMs, "Polling fetch interval");
    assertNonNegativeInteger(options.reconnect.minDelayMs, "Minimum reconnect delay");
    assertNonNegativeInteger(options.reconnect.maxDelayMs, "Maximum reconnect delay");
    if (options.reconnect.maxDelayMs < options.reconnect.minDelayMs) {
      throw new Error("Maximum reconnect delay must be greater than or equal to minimum delay");
    }
  }

  async start(): Promise<void> {
    if (this.startPromise) return this.startPromise;
    if (this.running) return;

    this.running = true;
    this.state.clear();
    this.reconnectAttempt = 0;
    const lifecycleId = ++this.lifecycleId;
    this.log("starting");

    try {
      const http = this.clients.createHttp(this.options.http);
      this.poller = new LatestBlockPoller({
        client: http,
        intervalMs: this.options.polling.fetchIntervalMs,
        onBlock: (block) => this.handleHttpHead(block),
        onError: (error) => this.reportError(error),
      });
    } catch (cause) {
      this.running = false;
      const error = toError(cause, "Failed to create HTTP client");
      this.reportError(error);
      throw error;
    }

    this.startPromise = this.connectWebSocket(lifecycleId).finally(() => {
      this.startPromise = undefined;
    });
    return this.startPromise;
  }

  async stop(): Promise<void> {
    if (!this.running && !this.startPromise) return;

    this.running = false;
    this.lifecycleId++;
    this.clearTimers();
    this.stopPolling();

    const websocket = this.websocket;
    const subscription = this.subscription;
    this.activeSocketId = 0;
    this.websocket = undefined;
    this.subscription = undefined;

    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (cause) {
        this.reportError(toError(cause, "Failed to unsubscribe from new heads"));
      }
    }
    websocket?.close();

    const starting = this.startPromise;
    if (starting) await starting;
    this.poller = undefined;
    this.state.clear();
    this.log("stopped");
  }

  private async connectWebSocket(lifecycleId: number): Promise<void> {
    if (!this.isCurrentLifecycle(lifecycleId)) return;

    const socketId = ++this.nextSocketId;
    this.activeSocketId = socketId;
    this.log(this.reconnectAttempt === 0 ? "websocket connecting" : "websocket reconnecting");

    try {
      const websocket = this.clients.createWebSocket(this.createWebSocketOptions(socketId));
      this.websocket = websocket;
      const subscription = await websocket.ethSubscribeNewHeads({
        onData: (head) => this.handleWebSocketHead(head, socketId),
        onError: (error) => this.handleWebSocketFailure(socketId, error),
      });

      if (!this.isCurrentSocket(lifecycleId, socketId)) {
        await this.discardLateSubscription(subscription, websocket);
        return;
      }

      this.subscription = subscription;
      this.log("websocket connected and subscribed");
      this.resetStaleTimer(socketId);
      this.scheduleHeartbeat(socketId);
    } catch (cause) {
      if (!this.isCurrentSocket(lifecycleId, socketId)) return;
      this.handleWebSocketFailure(
        socketId,
        toError(cause, "Failed to connect and subscribe to new heads"),
      );
    }
  }

  private createWebSocketOptions(socketId: number): WebSocketTransportOptions {
    const createWebSocket = observeSocket(
      this.options.websocket.createWebSocket ?? defaultWebSocketFactory,
      (event) => {
        const code = event.code === undefined ? "" : ` (${event.code})`;
        const reason = event.reason ? `: ${event.reason}` : "";
        this.handleWebSocketFailure(
          socketId,
          new WebSocketConnectionError(`WebSocket connection closed${code}${reason}.`),
        );
      },
    );

    return {
      ...this.options.websocket,
      createWebSocket,
      onError: (error) => this.handleWebSocketFailure(socketId, error),
      retry: false,
    };
  }

  private handleWebSocketHead(value: RpcHead, socketId: number): void {
    if (!this.isCurrentSocket(this.lifecycleId, socketId)) return;

    const head = this.parseWebSocketHead(value, socketId);
    if (!head) return;

    const latest = this.state.latest;
    if (latest && head.number < latest.number) return;

    this.dispatch(this.state.update(head, "websocket"));
    this.reconnectAttempt = 0;
    this.stopPolling();
    this.resetStaleTimer(socketId);
  }

  private handleHttpHead(value: RpcLatestBlock): void {
    if (!this.running) return;

    try {
      this.dispatch(this.state.update(parseBlockHead(value), "http"));
    } catch (cause) {
      this.reportError(toError(cause, "Invalid HTTP block head"));
    }
  }

  private parseWebSocketHead(value: RpcHead, socketId: number): BlockHead | undefined {
    try {
      return parseBlockHead(value);
    } catch (cause) {
      this.handleWebSocketFailure(socketId, toError(cause, "Invalid WebSocket block head"));
      return undefined;
    }
  }

  private dispatch(event: ReturnType<HeadState["update"]>): void {
    if (!event) return;

    try {
      if (event.type === "head") this.options.onHead(event);
      else this.options.onReorg(event);
    } catch (cause) {
      this.reportError(toError(cause, `${event.type} callback failed`));
    }
  }

  private handleWebSocketFailure(socketId: number, error: Error): void {
    if (!this.running || socketId !== this.activeSocketId) return;

    this.reportError(error);
    this.log(`websocket unhealthy: ${error.message}`);
    this.startPolling();
    this.clearWebSocketTimers();

    const websocket = this.websocket;
    this.activeSocketId = 0;
    this.websocket = undefined;
    this.subscription = undefined;
    websocket?.close();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.running || this.reconnectTimer) return;

    const attempt = ++this.reconnectAttempt;
    const delayMs = this.resolveReconnectDelay(attempt);
    this.log(`websocket reconnect scheduled in ${delayMs}ms`);

    const lifecycleId = this.lifecycleId;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connectWebSocket(lifecycleId);
    }, delayMs);
  }

  private scheduleHeartbeat(socketId: number): void {
    this.clearHeartbeatTimer();
    this.heartbeatTimer = setTimeout(
      () => void this.runHeartbeat(socketId),
      this.options.heartbeat.intervalMs,
    );
  }

  private async runHeartbeat(socketId: number): Promise<void> {
    const websocket = this.websocket;
    if (!websocket || !this.isCurrentSocket(this.lifecycleId, socketId)) return;

    try {
      const requestOptions = { timeoutMs: this.options.heartbeat.timeoutMs };
      if (this.options.heartbeat.method === "eth_blockNumber") {
        await websocket.ethBlockNumber(requestOptions);
      } else {
        await websocket.netVersion(requestOptions);
      }
      if (this.isCurrentSocket(this.lifecycleId, socketId)) this.scheduleHeartbeat(socketId);
    } catch (cause) {
      this.handleWebSocketFailure(socketId, toError(cause, "WebSocket heartbeat failed"));
    }
  }

  private resetStaleTimer(socketId: number): void {
    this.clearStaleTimer();
    this.staleTimer = setTimeout(() => {
      this.handleWebSocketFailure(
        socketId,
        new Error(
          `No current WebSocket head received for ${this.options.polling.delayBeforeStartMs}ms`,
        ),
      );
    }, this.options.polling.delayBeforeStartMs);
  }

  private resolveReconnectDelay(attempt: number): number {
    const { delay, maxDelayMs, minDelayMs } = this.options.reconnect;
    let requestedDelay = minDelayMs;
    try {
      requestedDelay = delay(attempt);
    } catch (cause) {
      this.reportError(toError(cause, "Reconnect delay function failed"));
      return minDelayMs;
    }

    if (!Number.isFinite(requestedDelay)) {
      this.reportError(new Error("Reconnect delay function must return a finite number"));
      return minDelayMs;
    }
    return Math.min(Math.max(requestedDelay, minDelayMs), maxDelayMs);
  }

  private startPolling(): void {
    if (!this.running || this.poller?.isRunning) return;
    this.log("http polling started");
    this.poller?.start();
  }

  private stopPolling(): void {
    if (!this.poller?.isRunning) return;
    this.poller.stop();
    this.log("http polling stopped");
  }

  private async discardLateSubscription(
    subscription: RpcSubscription,
    websocket: NewHeadsWebSocketClient,
  ): Promise<void> {
    try {
      await subscription.unsubscribe();
    } catch {
      // Closing the stale socket releases its server-side subscription.
    }
    websocket.close();
  }

  private isCurrentLifecycle(lifecycleId: number): boolean {
    return this.running && lifecycleId === this.lifecycleId;
  }

  private isCurrentSocket(lifecycleId: number, socketId: number): boolean {
    return this.isCurrentLifecycle(lifecycleId) && socketId === this.activeSocketId;
  }

  private clearTimers(): void {
    this.clearWebSocketTimers();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private clearWebSocketTimers(): void {
    this.clearHeartbeatTimer();
    this.clearStaleTimer();
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  private clearStaleTimer(): void {
    if (this.staleTimer) clearTimeout(this.staleTimer);
    this.staleTimer = undefined;
  }

  private reportError(error: Error): void {
    try {
      this.options.onError(error);
    } catch (cause) {
      this.log(`error callback failed: ${toError(cause, "unknown error").message}`);
    }
  }

  private log(message: string): void {
    try {
      this.options.onLog?.(`[NewHeads] ${message}`);
    } catch {
      // Logging must not affect the module lifecycle.
    }
  }
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}

function observeSocket(factory: WebSocketFactory, onClose: (event: WebSocketEvent) => void) {
  return (url: string): WebSocketLike => {
    const socket = factory(url);
    socket.addEventListener("close", onClose);
    return socket;
  };
}

function defaultWebSocketFactory(url: string): WebSocketLike {
  const WebSocketConstructor = (
    globalThis as unknown as { WebSocket?: new (url: string) => WebSocketLike }
  ).WebSocket;
  if (!WebSocketConstructor) {
    throw new WebSocketConnectionError("No WebSocket implementation available.");
  }
  return new WebSocketConstructor(url);
}
