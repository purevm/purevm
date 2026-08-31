import type { HttpRequestOptions } from "@purevm/transports";

import type { Address, BlockNumberOrTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

export type TraceFilterParameters = {
  /** Number of matching traces to skip. */
  after?: number;
  /** Maximum number of matching traces to return. */
  count?: number;
  /** Include traces initiated by any of these addresses. */
  fromAddress?: readonly Address[];
  /** Inclusive first block of the search range. */
  fromBlock?: BlockNumberOrTag;
  /** Include traces targeting any of these addresses. */
  toAddress?: readonly Address[];
  /** Inclusive final block of the search range. */
  toBlock?: BlockNumberOrTag;
};

type TraceFilter = RpcMethodDefinition<
  "trace_filter",
  readonly [TraceFilterParameters],
  TraceEntry[]
>;

export function traceFilter(
  client: RpcRequester<HttpRequestOptions>,
  filter: TraceFilterParameters,
  options?: HttpRequestOptions,
): Promise<TraceEntry[]> {
  return client.request<TraceFilter>({ method: "trace_filter", params: [filter] }, options);
}
