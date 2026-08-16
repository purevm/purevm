import type {
    JsonRpcClient,
    DebugTraceBlockByHash,
    DebugTraceBlockByNumber,
} from "./index.js";

/**
 * Creates Debug JSON-RPC methods.
 */
export function createDebugMethods<options = unknown>(
    client: JsonRpcClient<options>,
) {
    return {
        /**
         * Returns the trace of a block by its hash.
         */
        debugTraceBlockByHash<M extends DebugTraceBlockByHash>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "debug_traceBlockByHash",
                params,
            }, options);
        },
        /**
         * Returns the trace of a block by its number.
         */
        debugTraceBlockByNumber<M extends DebugTraceBlockByNumber>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "debug_traceBlockByNumber",
                params,
            }, options);
        },
    };
}
