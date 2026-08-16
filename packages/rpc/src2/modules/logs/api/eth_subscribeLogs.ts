/**
 * The log event from the API, represents a full Ethereum JSON-RPC log event.
 */
export type LogEvent = {
    address: `0x${string}`           // contrat émetteur
    topics: `0x${string}`[]          // [topic0 (signature), ...indexed args]
    data: `0x${string}`              // abi-encoded non-indexed args
    blockNumber: `0x${string}`       // hex
    blockHash: `0x${string}`
    transactionHash: `0x${string}`
    transactionIndex: `0x${string}`  // hex
    logIndex: `0x${string}`          // hex
    removed: boolean          // true si reorg (log annulé)
};

/**
 * The request body for the eth_subscribeLogs RPC method.
 *
 * @examples
 * topics: ["0xabc..."]                        // topic0 = 0xabc
 * topics: ["0xabc...", "0xdef..."]            // topic0 AND topic1
 * topics: ["0xabc...", null]                  // topic0, topic1 = anything
 * topics: [["0xabc...", "0xdef..."], null]    // (topic0 = A OR B) AND topic1 = anything
 * topics: [null, "0xdef..."]                  // topic0 = anything AND topic1 = 0xdef
 */
export type LogsFilter = {
    address?: `0x${string}` | `0x${string}`[];
    topics?: (`0x${string}` | `0x${string}`[] | null)[];
};

/**
 * The request body for the eth_subscribeLogs RPC method.
 */
export type RpcRequest = {
    id: 1;
    jsonrpc: "2.0";
    method: "eth_subscribe";
    params: ["logs", LogsFilter];
};

/**
 * The response body for the eth_subscribeNewHeads RPC method.
 */
export type RpcResponse = {
    id: 1;
    jsonrpc: "2.0";
    result: string; // subscription id
};

/**
 * The error body for the eth_subscribeNewHeads RPC method.
 */
export type RpcError = {
    id: 1;
    jsonrpc: "2.0";
    error: { code: number; message: string; data?: unknown };
};

/**
 * The notification body for the eth_subscribeNewHeads RPC method.
 */
export type RpcNotification = {
    jsonrpc: "2.0";
    method: "eth_subscription";
    params: {
        subscription: string;
        result: LogEvent;
    };
};
