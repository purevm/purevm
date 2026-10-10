import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { EthSimulatePayload, RpcSimulatedBlock } from "./types.js";

export type EthSimulateV1ByTagParameters = {
  /** Named base block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Simulated blocks, calls, and overrides. */
  payload: EthSimulatePayload;
};

type Method = RpcMethodDefinition<
  "eth_simulateV1",
  readonly [EthSimulatePayload, BlockTag],
  readonly RpcSimulatedBlock[]
>;

export function ethSimulateV1ByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthSimulateV1ByTagParameters,
  requestOptions?: options,
): Promise<readonly RpcSimulatedBlock[]> {
  return client.request<Method>(
    { method: "eth_simulateV1", params: [parameters.payload, parameters.blockTag] },
    requestOptions,
  );
}
