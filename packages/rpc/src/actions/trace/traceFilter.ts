import type { HttpRequestOptions } from "@purevm/transports";

import type { Address, BlockNumberOrTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

export type TraceFilterParameters = {
  after?: number;
  count?: number;
  fromAddress?: readonly Address[];
  fromBlock?: BlockNumberOrTag;
  toAddress?: readonly Address[];
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
