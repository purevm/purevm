import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceReplayTransactionResult, TraceType } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_replayBlockTransactions",
  readonly [BlockHash, readonly TraceType[]],
  TraceReplayTransactionResult[]
>;
export function traceReplayBlockTransactionsByHash(
  client: RpcRequester<HttpRequestOptions>,
  blockHash: BlockHash,
  traceTypes: readonly TraceType[],
  options?: HttpRequestOptions,
): Promise<TraceReplayTransactionResult[]> {
  return client.request<Method>(
    { method: "trace_replayBlockTransactions", params: [blockHash, traceTypes] },
    options,
  );
}
