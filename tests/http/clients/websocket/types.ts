// ============================================================
// WebSocket subscription types
// ============================================================

/** Handlers invoked for the lifetime of a single `eth_subscribe` subscription. */
export type WebSocketSubscriptionHandlers<TResult = unknown> = {
    /** Called for every `eth_subscription` notification belonging to this subscription. */
    onData: (result: TResult) => void;
    /** Called once the node confirms the subscription (and again after every reconnect). */
    onSubscribed?: (subscriptionId: string) => void;
    /** Called when this subscription fails (rejected, ack timeout). The client keeps retrying. */
    onError?: (error: Error) => void;
};

/** Public handle returned by `WebSocketClient.subscribe`. */
export type WebSocketSubscription = {
    /** Stable, client-local id (survives reconnects, unlike the node subscription id). */
    readonly id: number;
    /** The `eth_subscribe` params this subscription was created with. */
    readonly params: unknown[];
    /** Stop this subscription and (best-effort) `eth_unsubscribe` on the node. */
    unsubscribe(): void;
};

/** Internal per-subscription bookkeeping held by the registry. */
export type SubscriptionRecord = {
    /** Stable client-local id. */
    localId: number;
    /** `eth_subscribe` params. */
    params: unknown[];
    /** Notification / lifecycle handlers. */
    handlers: WebSocketSubscriptionHandlers;
    /** Id of the in-flight `eth_subscribe` request (null when not awaiting an ack). */
    requestId: number | null;
    /** Node-assigned subscription id (null until confirmed; reset on every reconnect). */
    nodeId: string | null;
    /** Timer guarding the `eth_subscribe` acknowledgement. */
    ackTimer: NodeJS.Timeout | null;
};

/** A parsed inbound frame, classified by what the client should do with it. */
export type ClassifiedMessage =
    /** Successful `eth_subscribe` reply carrying the node subscription id. */
    | { kind: "ack"; id: number; subscriptionId: string }
    /** Error reply to a request (e.g. a rejected `eth_subscribe`). */
    | { kind: "error"; id: number; code: number | null; message: string }
    /** An `eth_subscription` push notification. */
    | { kind: "notification"; subscriptionId: string; result: unknown }
    /** Anything we don't act on (e.g. `eth_unsubscribe` acks, malformed frames). */
    | { kind: "unknown" };
