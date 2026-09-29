import { RpcProviderError, WebSocketConnectionError } from "../errors/index.js";
import type { HeartbeatMethod, HeartbeatOptions } from "./types.js";

export type ResolvedHeartbeatOptions = {
  intervalMs: number;
  timeoutMs: number;
  method: HeartbeatMethod;
};

export const HEARTBEAT_METHODS: readonly HeartbeatMethod[] = [
  "eth_chainId",
  "net_version",
  "eth_blockNumber",
];

const DEFAULT_HEARTBEAT: ResolvedHeartbeatOptions = {
  intervalMs: 30_000,
  timeoutMs: 10_000,
  method: "eth_chainId",
};

export function resolveHeartbeat(
  options: false | HeartbeatOptions | undefined,
): false | ResolvedHeartbeatOptions {
  if (options === false) return false;

  const heartbeat = {
    intervalMs: options?.intervalMs ?? DEFAULT_HEARTBEAT.intervalMs,
    timeoutMs: options?.timeoutMs ?? DEFAULT_HEARTBEAT.timeoutMs,
    method: options?.method ?? DEFAULT_HEARTBEAT.method,
  };
  for (const [name, value] of [
    ["heartbeat.intervalMs", heartbeat.intervalMs],
    ["heartbeat.timeoutMs", heartbeat.timeoutMs],
  ] as const) {
    if (!Number.isSafeInteger(value) || value <= 0 || value > 2 ** 31 - 1) {
      throw new RangeError(`${name} must be a positive timer-safe integer.`);
    }
  }
  if (!HEARTBEAT_METHODS.includes(heartbeat.method)) {
    throw new TypeError(`heartbeat.method must be one of ${HEARTBEAT_METHODS.join(", ")}.`);
  }
  return heartbeat;
}

/**
 * Probes an idle connection. Any received message counts as activity, so busy connections are
 * never pinged. A provider error still proves the socket is alive.
 */
export class Heartbeat {
  private readonly options: ResolvedHeartbeatOptions;
  private readonly ping: (method: HeartbeatMethod, timeoutMs: number) => Promise<unknown>;
  private readonly onFailure: (error: Error) => void;
  private timer?: ReturnType<typeof setTimeout> | undefined;
  private lastActivity = 0;
  private generation = 0;

  constructor(
    options: ResolvedHeartbeatOptions,
    ping: (method: HeartbeatMethod, timeoutMs: number) => Promise<unknown>,
    onFailure: (error: Error) => void,
  ) {
    this.options = options;
    this.ping = ping;
    this.onFailure = onFailure;
  }

  start(): void {
    this.stop();
    this.lastActivity = Date.now();
    this.schedule(this.options.intervalMs);
  }

  touch(): void {
    this.lastActivity = Date.now();
  }

  stop(): void {
    this.generation += 1;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private schedule(delayMs: number): void {
    const generation = this.generation;
    this.timer = setTimeout(() => void this.check(generation), delayMs);
  }

  private async check(generation: number): Promise<void> {
    this.timer = undefined;
    const idleMs = Date.now() - this.lastActivity;
    if (idleMs < this.options.intervalMs) {
      this.schedule(this.options.intervalMs - idleMs);
      return;
    }

    try {
      await this.ping(this.options.method, this.options.timeoutMs);
    } catch (error) {
      if (generation !== this.generation) return;
      if (!(error instanceof RpcProviderError)) {
        this.onFailure(new WebSocketConnectionError("WebSocket heartbeat failed.", error));
        return;
      }
    }
    if (generation === this.generation) this.schedule(this.options.intervalMs);
  }
}
