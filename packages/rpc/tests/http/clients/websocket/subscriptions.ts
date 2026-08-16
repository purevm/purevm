import type { SubscriptionRecord, WebSocketSubscriptionHandlers } from "./types.js";

// ============================================================
// Subscription registry
// ============================================================

/**
 * Owns the set of registered subscriptions and all of their per-connection
 * bookkeeping: client-local ids, JSON-RPC request ids, node subscription ids,
 * and acknowledgement timers. It holds state only — the client drives it and
 * decides what to do on timeouts.
 */
export class SubscriptionRegistry {
    private _nextLocalId = 1;
    private _nextRequestId = 1;
    private readonly _records = new Map<number, SubscriptionRecord>();

    /** Register a new subscription and return its record. */
    public add(params: unknown[], handlers: WebSocketSubscriptionHandlers): SubscriptionRecord {
        const record: SubscriptionRecord = {
            localId: this._nextLocalId++,
            params,
            handlers,
            requestId: null,
            nodeId: null,
            ackTimer: null,
        };
        this._records.set(record.localId, record);
        return record;
    }

    /** Remove a subscription (clearing its ack timer) and return the removed record. */
    public remove(localId: number): SubscriptionRecord | undefined {
        const record = this._records.get(localId);
        if (!record) return undefined;
        this.clearAckTimer(record);
        this._records.delete(localId);
        return record;
    }

    /** Iterate every registered record. */
    public all(): IterableIterator<SubscriptionRecord> {
        return this._records.values();
    }

    /** Find the record awaiting the given `eth_subscribe`/`eth_unsubscribe` request id. */
    public findByRequestId(requestId: number): SubscriptionRecord | undefined {
        for (const record of this._records.values()) {
            if (record.requestId === requestId) return record;
        }
        return undefined;
    }

    /** Find the record bound to the given node subscription id. */
    public findByNodeId(nodeId: string): SubscriptionRecord | undefined {
        for (const record of this._records.values()) {
            if (record.nodeId === nodeId) return record;
        }
        return undefined;
    }

    /** Allocate the next JSON-RPC request id (used for unsubscribe and ad-hoc frames). */
    public nextRequestId(): number {
        return this._nextRequestId++;
    }

    /** Mark a record as awaiting an ack: assign a fresh request id and clear its node id. */
    public markPending(record: SubscriptionRecord): number {
        this.clearAckTimer(record);
        record.nodeId = null;
        record.requestId = this._nextRequestId++;
        return record.requestId;
    }

    /** Mark a record as confirmed: bind its node subscription id and clear the pending request. */
    public markActive(record: SubscriptionRecord, nodeId: string): void {
        this.clearAckTimer(record);
        record.requestId = null;
        record.nodeId = nodeId;
    }

    /** Store an acknowledgement timer on a record (clearing any previous one). */
    public setAckTimer(record: SubscriptionRecord, timer: NodeJS.Timeout): void {
        this.clearAckTimer(record);
        record.ackTimer = timer;
    }

    /** Clear a record's acknowledgement timer if present. */
    public clearAckTimer(record: SubscriptionRecord): void {
        if (record.ackTimer) {
            clearTimeout(record.ackTimer);
            record.ackTimer = null;
        }
    }

    /** Drop all per-connection state (timers, request ids, node ids). Records are kept. */
    public resetConnectionState(): void {
        for (const record of this._records.values()) {
            this.clearAckTimer(record);
            record.requestId = null;
            record.nodeId = null;
        }
    }
}
