import { createHttpClient, createWebSocketClient } from "@purevm/rpc-public";

import { BlockState } from "./block-state.js";
import { parseBlockHeader } from "./block.js";
import { LatestBlockPoller } from "./latest-block-poller.js";
import type {
  BlockHeader,
  BlockSource,
  NewBlocksClientFactory,
  NewBlocksEvent,
  NewBlocksOptions,
  RpcBlockHeader,
  RpcLatestBlock,
} from "./types.js";
import { assertNonNegativeInteger, assertPositiveInteger, toError } from "./utils.js";
import { WebSocketSession } from "./websocket-session.js";

const DEFAULT_HISTORY_SIZE = 128;

const defaultClientFactory: NewBlocksClientFactory = {
  createHttp: (options) => createHttpClient(options),
  createWebSocket: (options) => createWebSocketClient(options),
};

/**
 * Follows the latest block header of a chain. WebSocket `newHeads` is the fast path. When no newer
 * header arrives for `polling.staleAfterMs`, the socket is replaced and HTTP polling runs until the
 * new subscription catches up. Every header is classified against the emitted ones: duplicates are
 * dropped, skipped heights are reported as `gap` (never fetched), and branch switches as `reorg`.
 */
export class NewBlocks {
  private activeSessionId = 0;
  private lifecycleId = 0;
  private nextSessionId = 0;
  private poller?: LatestBlockPoller | undefined;
  private reconnectAttempt = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout> | undefined;
  private running = false;
  private session?: WebSocketSession | undefined;
  private readonly state: BlockState;
  private startPromise?: Promise<void> | undefined;
  private readonly pollIntervalMs: number;
  private readonly options: NewBlocksOptions;
  private readonly clients: NewBlocksClientFactory;

  constructor(options: NewBlocksOptions, clients: NewBlocksClientFactory = defaultClientFactory) {
    this.options = options;
    this.clients = clients;
    this.pollIntervalMs = options.polling.intervalMs ?? options.polling.staleAfterMs;
    const historySize = options.historySize ?? DEFAULT_HISTORY_SIZE;

    assertPositiveInteger(options.polling.staleAfterMs, "WebSocket stale timeout");
    assertPositiveInteger(this.pollIntervalMs, "Polling interval");
    assertPositiveInteger(historySize, "History size");
    assertNonNegativeInteger(options.reconnect.minDelayMs, "Minimum reconnect delay");
    assertNonNegativeInteger(options.reconnect.maxDelayMs, "Maximum reconnect delay");
    if (options.reconnect.maxDelayMs < options.reconnect.minDelayMs) {
      throw new Error("Maximum reconnect delay must be greater than or equal to minimum delay");
    }
    this.state = new BlockState(historySize);
  }

  /** Header of the last emitted block. */
  get head(): BlockHeader | undefined {
    return this.state.head;
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
        intervalMs: this.pollIntervalMs,
        onBlock: (block) => this.handleHttpBlock(block, lifecycleId),
        onError: (error) => this.reportError(error),
      });
    } catch (cause) {
      this.running = false;
      const error = toError(cause, "Failed to create HTTP client");
      this.reportError(error);
      throw error;
    }

    const initialBlock = this.poller.pollOnce();
    const subscription = this.connectWebSocket(lifecycleId);
    this.startPromise = Promise.all([initialBlock, subscription])
      .then(() => undefined)
      .finally(() => {
        this.startPromise = undefined;
      });
    return this.startPromise;
  }

  async stop(): Promise<void> {
    if (!this.running && !this.startPromise) return;

    this.running = false;
    this.lifecycleId++;
    this.clearReconnectTimer();
    this.stopPolling();

    const session = this.session;
    this.activeSessionId = 0;
    this.session = undefined;

    if (session) {
      try {
        await session.stop();
      } catch (cause) {
        this.reportError(toError(cause, "Failed to unsubscribe from new heads"));
      }
    }

    const starting = this.startPromise;
    if (starting) await starting.catch(() => undefined);
    this.poller = undefined;
    this.state.clear();
    this.log("stopped");
  }

  private async connectWebSocket(lifecycleId: number): Promise<void> {
    if (!this.isCurrentLifecycle(lifecycleId)) return;

    const sessionId = ++this.nextSessionId;
    this.activeSessionId = sessionId;
    this.log(this.reconnectAttempt === 0 ? "websocket connecting" : "websocket reconnecting");

    const session = new WebSocketSession({
      createClient: (options) => this.clients.createWebSocket(options),
      onFailure: (error) => this.handleWebSocketFailure(sessionId, error),
      onHead: (head) => this.handleWebSocketHead(head, sessionId, lifecycleId),
      staleAfterMs: this.options.polling.staleAfterMs,
      websocket: this.options.websocket,
    });
    this.session = session;

    try {
      await session.start();
      if (!this.isCurrentSession(lifecycleId, sessionId)) {
        await session.stop();
        return;
      }
      this.log("websocket connected and subscribed");
    } catch {
      // WebSocketSession reports the concrete failure before rejecting.
    }
  }

  /**
   * Handles a WebSocket header. Returns true when it is at least as high as the emitted head, which
   * proves the subscription is current and ends fallback polling.
   */
  private handleWebSocketHead(
    value: RpcBlockHeader,
    sessionId: number,
    lifecycleId: number,
  ): boolean {
    if (!this.isCurrentSession(lifecycleId, sessionId)) return false;

    const block = parseBlockHeader(value);
    const head = this.state.head;
    this.process(block, "websocket");
    if (head && block.number < head.number) return false;

    this.reconnectAttempt = 0;
    this.stopPolling();
    return true;
  }

  private handleHttpBlock(value: RpcLatestBlock, lifecycleId: number): void {
    if (!this.isCurrentLifecycle(lifecycleId)) return;
    try {
      this.process(parseBlockHeader(value), "http");
    } catch (cause) {
      this.reportError(toError(cause, "Invalid http block header"));
    }
  }

  private process(block: BlockHeader, source: BlockSource): void {
    const previous = this.state.head;
    if (!previous) {
      this.state.accept(block);
      this.dispatch({ block, source, type: "block" });
      return;
    }

    const relation = this.state.relation(block);
    switch (relation) {
      case "duplicate":
      case "stale":
        this.log(`ignored ${relation} ${source} block ${block.number}`);
        return;
      case "next":
        this.state.accept(block);
        this.dispatch({ block, previous, source, type: "block" });
        return;
      case "replacement": {
        const replaced = this.state.at(block.number);
        this.state.accept(block);
        this.dispatch({ block, kind: "replacement", previous, replaced, source, type: "reorg" });
        return;
      }
      case "parent-mismatch":
        this.state.accept(block);
        this.dispatch({ block, kind: "parent-mismatch", previous, source, type: "reorg" });
        return;
      case "gap": {
        const from = previous.number + 1n;
        const to = block.number - 1n;
        this.state.accept(block);
        this.dispatch({
          block,
          missing: { count: to - from + 1n, from, to },
          previous,
          source,
          type: "gap",
        });
      }
    }
  }

  private dispatch(event: NewBlocksEvent): void {
    this.logEvent(event);
    try {
      this.options.onEvent(event);
    } catch (cause) {
      this.reportError(toError(cause, `${event.type} callback failed`));
    }
  }

  private logEvent(event: NewBlocksEvent): void {
    if (event.type === "gap") {
      this.log(
        `gap before block ${event.block.number}: missing ${event.missing.from}-${event.missing.to}`,
      );
    } else if (event.type === "reorg") {
      this.log(`reorg at block ${event.block.number}: ${event.kind}`);
    } else {
      this.log(`block ${event.block.number} received from ${event.source}`);
    }
  }

  private handleWebSocketFailure(sessionId: number, error: Error): void {
    if (!this.running || sessionId !== this.activeSessionId) return;

    this.reportError(error);
    this.log(`websocket unhealthy: ${error.message}`);
    this.startPolling();

    const session = this.session;
    this.activeSessionId = 0;
    this.session = undefined;
    session?.close();
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

  private isCurrentLifecycle(lifecycleId: number): boolean {
    return this.running && lifecycleId === this.lifecycleId;
  }

  private isCurrentSession(lifecycleId: number, sessionId: number): boolean {
    return this.isCurrentLifecycle(lifecycleId) && sessionId === this.activeSessionId;
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
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
      this.options.onLog?.(`[NewBlocks] ${message}`);
    } catch {
      // Logging must not affect stream state or lifecycle.
    }
  }
}
