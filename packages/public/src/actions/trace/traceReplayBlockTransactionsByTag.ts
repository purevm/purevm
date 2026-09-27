import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceReplayTransactionResult, TraceType } from "./types.js";

export type TraceReplayBlockTransactionsByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Trace kinds to produce: `trace`, `vmTrace`, and/or `stateDiff`. */
  traceTypes: readonly TraceType[];
};

type Method = RpcMethodDefinition<
  "trace_replayBlockTransactions",
  readonly [BlockTag, readonly TraceType[]],
  readonly TraceReplayTransactionResult[]
>;
export function traceReplayBlockTransactionsByTag(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceReplayBlockTransactionsByTagParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceReplayTransactionResult[]> {
  return client.request<Method>(
    {
      method: "trace_replayBlockTransactions",
      params: [parameters.blockTag, parameters.traceTypes],
    },
    options,
  );
}
