import type { RpcId } from "../types.js";

export const LATE_SUBSCRIPTION_TTL_MS = 60_000;

/** Request ids of `eth_subscribe` calls abandoned before their response arrived. */
export class LateSubscriptions {
  private readonly ids = new Map<RpcId, ReturnType<typeof setTimeout>>();

  track(id: RpcId): void {
    this.take(id);
    this.ids.set(
      id,
      setTimeout(() => this.ids.delete(id), LATE_SUBSCRIPTION_TTL_MS),
    );
  }

  take(id: RpcId): boolean {
    const timer = this.ids.get(id);
    if (timer === undefined) return false;
    clearTimeout(timer);
    this.ids.delete(id);
    return true;
  }

  clear(): void {
    for (const timer of this.ids.values()) clearTimeout(timer);
    this.ids.clear();
  }
}
