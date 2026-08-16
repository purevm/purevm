/**
 * The block header from the API, represents a full Ethereum JSON-RPC block (without transactions objects).
 */
export type RpcBlock = {
    number: `0x${string}` | null;
    hash: `0x${string}` | null;
    parentHash: `0x${string}`;
    sha3Uncles: `0x${string}`;
    nonce: `0x${string}` | null;
    logsBloom: `0x${string}` | null;
    transactionsRoot: `0x${string}`;
    baseFeePerGas: `0x${string}` | null;
    blobGasUsed: `0x${string}` | null;
    difficulty: `0x${string}`;
    excessBlobGas: `0x${string}` | null;
    extraData: `0x${string}`;
    gasLimit: `0x${string}`;
    gasUsed: `0x${string}`;
    miner: `0x${string}`;
    mixHash: `0x${string}`;
    parentBeaconBlockRoot?: `0x${string}`;
    receiptsRoot: `0x${string}`;
    milliTimestamp?: `0x${string}`;
    size: `0x${string}`;
    stateRoot: `0x${string}`;
    timestamp: `0x${string}`;
    totalDifficulty?: `0x${string}` | null;
    withdrawals?: any[];
    withdrawalsRoot?: `0x${string}`;
};

/**
 * The request body for the eth_getBlockByNumber RPC method.
 */
export type RpcRequest = {
    id: 1;
    jsonrpc: "2.0";
    method: "eth_getBlockByNumber";
    params: ["latest" | "earliest" | `0x${string}`, false];
};

/**
 * The response body for the eth_getBlockByNumber RPC method.
 */
export type RpcResponse = {
    id: 1;
    jsonrpc: "2.0";
    result: RpcBlock;
};

/**
 * The error body for the eth_getBlockByNumber RPC method.
 */
export type RpcError = {
    id: 1;
    jsonrpc: "2.0";
    error: { code: number; message: string; data?: unknown };
};

/**
 * Fetches a block by number from the API.
 * @param url - The URL of the API to fetch the block from.
 * @param number - The number of the block to fetch.
 * @returns The block header.
 */
export async function ethGetBlockByNumber(url: string, tag: "latest" | "earliest" | `0x${string}`): Promise<RpcBlock> {
    const requestBody = JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_getBlockByNumber",
        params: [tag, false],
    });

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: requestBody,
    });

    if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json() as RpcResponse | RpcError;

    if ("error" in json) {
        throw new Error(`RPC error: ${JSON.stringify(json)}`);
    }

    if (!json.result) {
        throw new Error(`RPC error: ${JSON.stringify(json)}`);
    }
    
    return json.result;
}