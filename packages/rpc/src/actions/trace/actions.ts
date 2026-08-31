import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash, BlockNumberOrTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry, TraceFilterParameters } from "./types.js";

type TraceBlockByHash = RpcMethodDefinition<"trace_block", readonly [BlockHash], TraceEntry[]>;
type TraceBlockByNumber = RpcMethodDefinition<
  "trace_block",
  readonly [BlockNumberOrTag],
  TraceEntry[]
>;
type TraceFilter = RpcMethodDefinition<
  "trace_filter",
  readonly [TraceFilterParameters],
  TraceEntry[]
>;

export function traceBlockByHash(
  client: RpcRequester<HttpRequestOptions>,
  blockHash: BlockHash,
  options?: HttpRequestOptions,
): Promise<TraceEntry[]> {
  return client.request<TraceBlockByHash>({ method: "trace_block", params: [blockHash] }, options);
}

export function traceBlockByNumber(
  client: RpcRequester<HttpRequestOptions>,
  blockNumber: BlockNumberOrTag,
  options?: HttpRequestOptions,
): Promise<TraceEntry[]> {
  return client.request<TraceBlockByNumber>(
    { method: "trace_block", params: [blockNumber] },
    options,
  );
}

export function traceFilter(
  client: RpcRequester<HttpRequestOptions>,
  filter: TraceFilterParameters,
  options?: HttpRequestOptions,
): Promise<TraceEntry[]> {
  return client.request<TraceFilter>({ method: "trace_filter", params: [filter] }, options);
}
