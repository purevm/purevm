import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockNumber } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { EthSimulatePayload, RpcSimulatedBlock } from "./types.js";

export type EthSimulateV1ByNumberParameters = {
  /** Hex-encoded number of the base block. */
  blockNumber: BlockNumber;
  /** Simulated blocks, calls, and overrides. */
  payload: EthSimulatePayload;
};

type Method = RpcMethodDefinition<
  "eth_simulateV1",
  readonly [EthSimulatePayload, BlockNumber],
  readonly RpcSimulatedBlock[]
>;

export function ethSimulateV1ByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthSimulateV1ByNumberParameters,
  requestOptions?: options,
): Promise<readonly RpcSimulatedBlock[]> {
  return client.request<Method>(
    { method: "eth_simulateV1", params: [parameters.payload, parameters.blockNumber] },
    requestOptions,
  );
}
