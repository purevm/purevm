import type {
    JsonRpcClient,
    TraceBlockByHash,
    TraceBlockByNumber,
    TraceFilter,
} from "./index.js";

/**
 * Creates Trace JSON-RPC methods.
 */
export function createTraceMethods<options = unknown>(
    client: JsonRpcClient<options>,
) {
    return {
        /**
         * Returns the trace of a block by its hash.
         */
        traceBlockByHash<M extends TraceBlockByHash>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "trace_block",
                params,
            }, options);
        },
        /**
         * Returns the trace of a block by its number.
         */
        traceBlockByNumber<M extends TraceBlockByNumber>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "trace_block",
                params,
            }, options);
        },
        /**
         * Returns the trace of a filter.
         */
        traceFilter<M extends TraceFilter>(
            params: M["params"],
            options?: options | undefined,
        ) {
            return client.request<M>({
                method: "trace_filter",
                params,
            }, options);
        },
    };
}