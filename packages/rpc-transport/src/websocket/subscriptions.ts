import type { JsonValue } from "../types.js";
import type { SubscribeOptions } from "./types.js";

export type SubscriptionRecord = {
  readonly params: readonly JsonValue[];
  readonly onData: (result: unknown) => void;
  readonly onError?: ((error: Error) => void) | undefined;
  id?: string | undefined;
};

export class Subscriptions {
  private readonly records = new Set<SubscriptionRecord>();
  private readonly byId = new Map<string, SubscriptionRecord>();

  add<result>(options: SubscribeOptions<result>, id: string): SubscriptionRecord {
    const record: SubscriptionRecord = {
      params: options.params,
      onData: options.onData as (result: unknown) => void,
      onError: options.onError,
    };
    this.records.add(record);
    this.bind(record, id);
    return record;
  }

  bind(record: SubscriptionRecord, id: string): void {
    if (record.id) this.byId.delete(record.id);
    record.id = id;
    this.byId.set(id, record);
  }

  unbindAll(): void {
    this.byId.clear();
    for (const record of this.records) record.id = undefined;
  }

  has(record: SubscriptionRecord): boolean {
    return this.records.has(record);
  }

  hasUnbound(): boolean {
    for (const record of this.records) if (!record.id) return true;
    return false;
  }

  get(id: string): SubscriptionRecord | undefined {
    return this.byId.get(id);
  }

  remove(record: SubscriptionRecord): void {
    this.records.delete(record);
    if (record.id) this.byId.delete(record.id);
  }

  values(): readonly SubscriptionRecord[] {
    return [...this.records];
  }

  get size(): number {
    return this.records.size;
  }
}
