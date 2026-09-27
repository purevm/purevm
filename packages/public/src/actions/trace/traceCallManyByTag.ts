import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceCallManyEntry, TraceReplayResult } from "./types.js";

export type TraceCallManyByTagParameters = {
  /** Named target block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Calls executed in sequence, each with its own trace kinds. */
  calls: readonly TraceCallManyEntry[];
};

type Method = RpcMethodDefinition<
  "trace_callMany",
  readonly [readonly TraceCallManyEntry[], BlockTag],
  readonly TraceReplayResult[]
>;
export function traceCallManyByTag(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceCallManyByTagParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceReplayResult[]> {
  return client.request<Method>(
    { method: "trace_callMany", params: [parameters.calls, parameters.blockTag] },
    options,
  );
}
