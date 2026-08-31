import { RpcAbortError, RpcTimeoutError } from "../errors/index.js";
import type { RpcId } from "../types.js";

type PendingRequest = {
  resolve(value: unknown): void;
  reject(error: unknown): void;
  dispose(): void;
};

export class PendingRequests {
  private readonly requests = new Map<RpcId, PendingRequest>();

  add(id: RpcId, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
    if (signal?.aborted) return Promise.reject(new RpcAbortError(signal.reason));

    return new Promise((resolve, reject) => {
      const aborted = () => this.reject(id, new RpcAbortError(signal?.reason));
      const timer = setTimeout(() => this.reject(id, new RpcTimeoutError(timeoutMs)), timeoutMs);
      const request: PendingRequest = {
        resolve,
        reject,
        dispose() {
          clearTimeout(timer);
          signal?.removeEventListener("abort", aborted);
        },
      };

      this.requests.set(id, request);
      signal?.addEventListener("abort", aborted, { once: true });
      if (signal?.aborted) aborted();
    });
  }

  has(id: RpcId): boolean {
    return this.requests.has(id);
  }

  resolve(id: RpcId, value: unknown): void {
    const request = this.take(id);
    request?.resolve(value);
  }

  reject(id: RpcId, error: unknown): void {
    const request = this.take(id);
    request?.reject(error);
  }

  rejectAll(error: unknown): void {
    for (const id of this.requests.keys()) this.reject(id, error);
  }

  private take(id: RpcId): PendingRequest | undefined {
    const request = this.requests.get(id);
    if (!request) return undefined;
    this.requests.delete(id);
    request.dispose();
    return request;
  }
}
