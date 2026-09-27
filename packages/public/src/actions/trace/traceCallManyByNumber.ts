import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceCallManyEntry, TraceReplayResult } from "./types.js";

export type TraceCallManyByNumberParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
  /** Calls executed in sequence, each with its own trace kinds. */
  calls: readonly TraceCallManyEntry[];
};

type Method = RpcMethodDefinition<
  "trace_callMany",
  readonly [readonly TraceCallManyEntry[], BlockNumber],
  readonly TraceReplayResult[]
>;
export function traceCallManyByNumber(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceCallManyByNumberParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceReplayResult[]> {
  return client.request<Method>(
    { method: "trace_callMany", params: [parameters.calls, parameters.blockNumber] },
    options,
  );
}
