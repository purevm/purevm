import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { Address, BlockNumberOrTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

export type TraceFilterParameters = {
  /** Number of matching traces to skip. */
  after?: number | undefined;
  /** Maximum number of matching traces to return. */
  count?: number | undefined;
  /** Include traces initiated by any of these addresses. */
  fromAddress?: readonly Address[] | undefined;
  /** Inclusive first block of the search range. */
  fromBlock?: BlockNumberOrTag | undefined;
  /** Include traces targeting any of these addresses. */
  toAddress?: readonly Address[] | undefined;
  /** Inclusive final block of the search range. */
  toBlock?: BlockNumberOrTag | undefined;
};

type TraceFilter = RpcMethodDefinition<
  "trace_filter",
  readonly [TraceFilterParameters],
  readonly TraceEntry[]
>;

export function traceFilter(
  client: RpcRequester<HttpRequestOptions>,
  filter: TraceFilterParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceEntry[]> {
  return client.request<TraceFilter>({ method: "trace_filter", params: [filter] }, options);
}
