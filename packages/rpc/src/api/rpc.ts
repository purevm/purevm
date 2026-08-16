import type { RpcMethod, RpcCall } from "../types/rpc.types.js";

/**
 * Type representing the JSON-RPC client
 */
export type JsonRpcClient<options = unknown> = {
    /**
     * Sends a typed JSON-RPC request and returns its `result`.
     */
    request<method extends RpcMethod>(
        /** The request to make */
        request: RpcCall<method>,
        /** The options for the request */
        options?: options | undefined,
    ): Promise<method['result']>
}