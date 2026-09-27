import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockHash } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

export type TraceBlockByHashParameters = {
  /** Hash of the target block. */
  blockHash: BlockHash;
};

type TraceBlockByHash = RpcMethodDefinition<
  "trace_block",
  readonly [BlockHash],
  readonly TraceEntry[]
>;

export function traceBlockByHash(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceBlockByHashParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceEntry[]> {
  return client.request<TraceBlockByHash>(
    { method: "trace_block", params: [parameters.blockHash] },
    options,
  );
}
