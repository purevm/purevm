import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceReplayTransactionResult, TraceType } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_replayBlockTransactions",
  readonly [BlockNumber, readonly TraceType[]],
  TraceReplayTransactionResult[]
>;
export function traceReplayBlockTransactionsByNumber(
  client: RpcRequester<HttpRequestOptions>,
  blockNumber: BlockNumber,
  traceTypes: readonly TraceType[],
  options?: HttpRequestOptions,
): Promise<TraceReplayTransactionResult[]> {
  return client.request<Method>(
    { method: "trace_replayBlockTransactions", params: [blockNumber, traceTypes] },
    options,
  );
}
