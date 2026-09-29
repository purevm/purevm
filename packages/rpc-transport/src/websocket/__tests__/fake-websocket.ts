import type { WebSocketEvent, WebSocketLike, WebSocketListener } from "../types.js";

export type FakeRequest = {
  id: number;
  method: string;
  params?: unknown;
};

export type FakeWebSocketOptions = {
  autoOpen?: boolean | undefined;
  subscriptionId?: string | undefined;
  onSend?: ((request: FakeRequest, socket: FakeWebSocket) => void) | undefined;
};

export class FakeWebSocket implements WebSocketLike {
  readyState = 0;
  readonly sent: FakeRequest[] = [];
  throwOnSend?: unknown;
  private readonly listeners = new Map<string, Set<WebSocketListener>>();
  private readonly options: FakeWebSocketOptions;

  constructor(options: FakeWebSocketOptions = {}) {
    this.options = options;
    if (options.autoOpen !== false) queueMicrotask(() => this.open());
  }

  addEventListener(type: string, listener: WebSocketListener): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: WebSocketListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  send(data: string): void {
    if (this.throwOnSend) throw this.throwOnSend;
    const request = JSON.parse(data) as FakeRequest;
    this.sent.push(request);
    if (this.options.onSend) {
      this.options.onSend(request, this);
      return;
    }

    const result =
      request.method === "eth_subscribe"
        ? (this.options.subscriptionId ?? "subscription-1")
        : request.method === "eth_unsubscribe"
          ? true
          : "0x1";
    queueMicrotask(() => this.respond(request.id, result));
  }

  close(code = 1_000, reason = ""): void {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.emit("close", { code, reason });
  }

  open(): void {
    if (this.readyState !== 0) return;
    this.readyState = 1;
    this.emit("open", {});
  }

  fail(error: unknown): void {
    this.emit("error", { error });
  }

  disconnect(): void {
    this.close(1_006, "Disconnected");
  }

  respond(id: number, result: unknown): void {
    this.receive({ id, jsonrpc: "2.0", result });
  }

  reject(id: number, code: number, message: string, data?: unknown): void {
    this.receive({ id, jsonrpc: "2.0", error: { code, data, message } });
  }

  receive(message: unknown): void {
    this.receiveData(JSON.stringify(message));
  }

  receiveData(data: unknown): void {
    this.emit("message", { data });
  }

  private emit(type: string, event: WebSocketEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}
