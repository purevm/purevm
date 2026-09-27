import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceCallManyEntry, TraceReplayResult } from "./types.js";

export type TraceCallManyByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
  /** Calls executed in sequence, each with its own trace kinds. */
  calls: readonly TraceCallManyEntry[];
};

type Method = RpcMethodDefinition<
  "trace_callMany",
  readonly [readonly TraceCallManyEntry[], BlockHash],
  readonly TraceReplayResult[]
>;
export function traceCallManyByHash(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceCallManyByHashParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceReplayResult[]> {
  return client.request<Method>(
    { method: "trace_callMany", params: [parameters.calls, parameters.blockHash] },
    options,
  );
}
