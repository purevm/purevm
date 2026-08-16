/**
 * The block header from the API, represents a full Ethereum JSON-RPC block (without transactions objects).
 */
export type RpcHead = {
    /** The block number as hex quantity */
    number: `0x${string}` | null;
    /** The block hash */
    hash: `0x${string}` | null;
    /** The parent block hash */
    parentHash: `0x${string}`;
    /** The uncle hash */
    sha3Uncles: `0x${string}`;
    /** The log bloom */
    logsBloom: `0x${string}` | null;
    /** The transactions trie root */
    transactionsRoot: `0x${string}`;
    /** The state trie root */
    stateRoot: `0x${string}`;
    /** The receipts trie root */
    receiptsRoot: `0x${string}`;
    /** The miner / fee recipient address */
    miner: `0x${string}`;
    /** The difficulty as hex quantity */
    difficulty: `0x${string}`;
    /** Extra data */
    extraData: `0x${string}`;
    /** The gas limit as hex quantity */
    gasLimit: `0x${string}`;
    /** The gas used as hex quantity */
    gasUsed: `0x${string}`;
    /** The unix timestamp in seconds as hex quantity */
    timestamp: `0x${string}`;
    /** The base fee per gas as hex quantity */
    baseFeePerGas?: `0x${string}`;
    /** The withdrawals root */
    withdrawalsRoot?: `0x${string}`;
};

/**
 * The request body for the eth_subscribeNewHeads RPC method.
 */
export type RpcRequest = {
    id: 1;
    jsonrpc: "2.0";
    method: "eth_subscribe";
    params: ["newHeads"];
};

/**
 * The response body for the eth_subscribeNewHeads RPC method.
 */
export type RpcResponse = {
    id: 1;
    jsonrpc: "2.0";
    result: string;
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
        result: RpcHead;
    };
};
