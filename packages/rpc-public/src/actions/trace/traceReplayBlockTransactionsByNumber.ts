import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceReplayTransactionResult, TraceType } from "./types.js";

export type TraceReplayBlockTransactionsByNumberParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
  /** Trace kinds to produce: `trace`, `vmTrace`, and/or `stateDiff`. */
  traceTypes: readonly TraceType[];
};

type Method = RpcMethodDefinition<
  "trace_replayBlockTransactions",
  readonly [BlockNumber, readonly TraceType[]],
  readonly TraceReplayTransactionResult[]
>;
export function traceReplayBlockTransactionsByNumber(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceReplayBlockTransactionsByNumberParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceReplayTransactionResult[]> {
  return client.request<Method>(
    {
      method: "trace_replayBlockTransactions",
      params: [parameters.blockNumber, parameters.traceTypes],
    },
    options,
  );
}
