import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceReplayTransactionResult, TraceType } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_replayBlockTransactions",
  readonly [BlockTag, readonly TraceType[]],
  TraceReplayTransactionResult[]
>;
export function traceReplayBlockTransactionsByTag(
  client: RpcRequester<HttpRequestOptions>,
  blockTag: BlockTag,
  traceTypes: readonly TraceType[],
  options?: HttpRequestOptions,
): Promise<TraceReplayTransactionResult[]> {
  return client.request<Method>(
    { method: "trace_replayBlockTransactions", params: [blockTag, traceTypes] },
    options,
  );
}
