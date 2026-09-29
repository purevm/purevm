import type { HttpRequestOptions } from "@purevm/rpc-transport";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceReplayTransactionResult, TraceType } from "./types.js";

export type TraceReplayBlockTransactionsByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
  /** Trace kinds to produce: `trace`, `vmTrace`, and/or `stateDiff`. */
  traceTypes: readonly TraceType[];
};

type Method = RpcMethodDefinition<
  "trace_replayBlockTransactions",
  readonly [BlockHash, readonly TraceType[]],
  readonly TraceReplayTransactionResult[]
>;
export function traceReplayBlockTransactionsByHash(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceReplayBlockTransactionsByHashParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceReplayTransactionResult[]> {
  return client.request<Method>(
    {
      method: "trace_replayBlockTransactions",
      params: [parameters.blockHash, parameters.traceTypes],
    },
    options,
  );
}
