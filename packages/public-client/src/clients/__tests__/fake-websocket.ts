import type { WebSocketEvent, WebSocketLike, WebSocketListener } from "@purevm/rpc-transport";

export type FakeRequest = { id: number; method: string; params?: unknown };

export class FakeWebSocket implements WebSocketLike {
  readyState = 0;
  readonly sent: FakeRequest[] = [];
  private readonly listeners = new Map<string, Set<WebSocketListener>>();

  constructor() {
    queueMicrotask(() => this.open());
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
    const request = JSON.parse(data) as FakeRequest;
    this.sent.push(request);
    const result = request.method === "eth_subscribe" ? `subscription-${request.id}` : true;
    queueMicrotask(() => this.receive({ id: request.id, jsonrpc: "2.0", result }));
  }

  close(code = 1_000, reason = ""): void {
    this.readyState = 3;
    this.emit("close", { code, reason });
  }

  receive(message: unknown): void {
    this.emit("message", { data: JSON.stringify(message) });
  }

  private open(): void {
    this.readyState = 1;
    this.emit("open", {});
  }

  private emit(type: string, event: WebSocketEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}
