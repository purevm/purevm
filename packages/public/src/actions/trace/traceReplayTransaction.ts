import type { HttpRequestOptions } from "@purevm/transports";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceReplayResult, TraceType } from "./types.js";

export type TraceReplayTransactionParameters = {
  /** Trace kinds to produce: `trace`, `vmTrace`, and/or `stateDiff`. */
  traceTypes: readonly TraceType[];
  /** Hash of the target transaction. */
  transactionHash: TransactionHash;
};

type Method = RpcMethodDefinition<
  "trace_replayTransaction",
  readonly [TransactionHash, readonly TraceType[]],
  TraceReplayResult
>;
export function traceReplayTransaction(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceReplayTransactionParameters,
  options?: HttpRequestOptions,
): Promise<TraceReplayResult> {
  return client.request<Method>(
    {
      method: "trace_replayTransaction",
      params: [parameters.transactionHash, parameters.traceTypes],
    },
    options,
  );
}
