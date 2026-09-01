import type { NewHeadsHttpClient, RpcLatestBlock } from "./types.js";

export type LatestBlockPollerOptions = {
  client: NewHeadsHttpClient;
  intervalMs: number;
  onBlock: (block: RpcLatestBlock) => void;
  onError: (error: Error) => void;
};

export class LatestBlockPoller {
  private inFlight?: Promise<void>;
  private running = false;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(private readonly options: LatestBlockPollerOptions) {
    assertPositiveInteger(options.intervalMs, "Polling interval");
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    void this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  pollOnce(): Promise<void> {
    if (this.inFlight) return this.inFlight;

    const request = this.options.client
      .ethGetBlockByTag({ blockTag: "latest" })
      .then((block) => {
        if (block) this.options.onBlock(block);
        return undefined;
      })
      .catch((cause: unknown) =>
        this.options.onError(toError(cause, "Failed to fetch latest block")),
      )
      .finally(() => {
        if (this.inFlight === request) this.inFlight = undefined;
      });
    this.inFlight = request;
    return request;
  }

  private async tick(): Promise<void> {
    await this.pollOnce();
    if (!this.running) return;
    this.timer = setTimeout(() => void this.tick(), this.options.intervalMs);
  }
}

export function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer`);
  }
}

export function toError(cause: unknown, fallback: string): Error {
  if (cause instanceof Error) return cause;
  if (typeof cause === "string") return new Error(cause);
  return new Error(fallback, { cause });
}
