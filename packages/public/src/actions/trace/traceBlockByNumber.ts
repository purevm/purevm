import type { HttpRequestOptions } from "@purevm/transports";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TraceEntry } from "./types.js";

export type TraceBlockByNumberParameters = {
  /** Hex-encoded number of the target block. */
  blockNumber: BlockNumber;
};

type TraceBlockByNumber = RpcMethodDefinition<
  "trace_block",
  readonly [BlockNumber],
  readonly TraceEntry[]
>;

export function traceBlockByNumber(
  client: RpcRequester<HttpRequestOptions>,
  parameters: TraceBlockByNumberParameters,
  options?: HttpRequestOptions,
): Promise<readonly TraceEntry[]> {
  return client.request<TraceBlockByNumber>(
    { method: "trace_block", params: [parameters.blockNumber] },
    options,
  );
}
