import type { HttpRequestOptions } from "@purevm/transports";

import type { TransactionHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceReplayResult, TraceType } from "./types.js";

type Method = RpcMethodDefinition<
  "trace_replayTransaction",
  readonly [TransactionHash, readonly TraceType[]],
  TraceReplayResult
>;
export function traceReplayTransaction(
  client: RpcRequester<HttpRequestOptions>,
  transactionHash: TransactionHash,
  traceTypes: readonly TraceType[],
  options?: HttpRequestOptions,
): Promise<TraceReplayResult> {
  return client.request<Method>(
    { method: "trace_replayTransaction", params: [transactionHash, traceTypes] },
    options,
  );
}
