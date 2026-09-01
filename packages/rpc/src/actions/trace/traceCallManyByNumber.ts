import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceCallManyEntry, TraceReplayResult } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_callMany",
  readonly [readonly TraceCallManyEntry[], BlockNumber],
  TraceReplayResult[]
>;
export function traceCallManyByNumber(
  client: RpcRequester<HttpRequestOptions>,
  calls: readonly TraceCallManyEntry[],
  blockNumber: BlockNumber,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult[]> {
  return client.request<Method>(
    { method: "trace_callMany", params: [calls, blockNumber] },
    options,
  );
}
