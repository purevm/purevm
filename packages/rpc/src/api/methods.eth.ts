import type { 
    JsonRpcClient,
    EthBlockNumber,
    EthChainId,
    EthGetBalance,
    EthGetBlockByHash,
    EthGetBlockByNumber,
    EthGetBlockReceiptsByHash,
    EthGetBlockReceiptsByNumber,
    EthGetCode,
    EthGetLogsByHash,
    EthGetLogsByRange,
    EthGetTransactionByHash,
    EthGetTransactionReceipt,
} from "./index.js";

/**
 * Creates Ethereum JSON-RPC methods.
 */
export function createEthMethods<options = unknown>(
    client: JsonRpcClient<options>,
) {
    return {
        /**
         * Sends a typed JSON-RPC request over HTTP and returns its `result`.
         */
        getBlockNumber<M extends EthBlockNumber>(
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_blockNumber",
                params: undefined,
            }, options);
        },
        /**
         * Returns the chain ID.
         */
        getChainId<M extends EthChainId>(
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_chainId",
                params: undefined,
            }, options);
        },
        /**
         * Returns the account balance at a specific block.
         */
        getBalance<M extends EthGetBalance>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getBalance",
                params,
            }, options);
        },
        /**
         * Returns a block by its hash.
         */
        getBlockByHash<M extends EthGetBlockByHash<boolean>>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getBlockByHash",
                params,
            }, options);
        },
        /**
         * Returns a block by its number.
         */
        getBlockByNumber<M extends EthGetBlockByNumber<boolean>>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getBlockByNumber",
                params,
            }, options);
        },
        /**
         * Returns all receipts for a block by hash.
         */
        getBlockReceiptsByHash<M extends EthGetBlockReceiptsByHash>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getBlockReceipts",
                params,
            }, options);
        },
        /**
         * Returns all receipts for a block by number.
         */
        getBlockReceiptsByNumber<M extends EthGetBlockReceiptsByNumber>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getBlockReceipts",
                params,
            }, options);
        },
        /**
         * Returns the code at a given address.
         */
        getCode<M extends EthGetCode>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getCode",
                params,
            }, options);
        },
        /**
         * Returns logs for a block by its hash.
         */
        getLogsByHash<M extends EthGetLogsByHash>(  
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getLogs",
                params,
            }, options);
        },
        /**
         * Returns logs for a block range.
         */
        getLogsByRange<M extends EthGetLogsByRange>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getLogs",
                params,
            }, options);
        },
        /**
         * Returns a transaction by its hash.
         */
        getTransactionByHash<M extends EthGetTransactionByHash>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getTransactionByHash",
                params,
            }, options);
        },
        /**
         * Returns the receipt for a specific transaction by hash.
         */
        getTransactionReceipt<M extends EthGetTransactionReceipt>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "eth_getTransactionReceipt",
                params,
            }, options);
        },
    };
}