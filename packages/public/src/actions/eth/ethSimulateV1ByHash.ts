import type { RequestOptions } from "@purevm/transports";

import type { BlockHash, BlockHashReference } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toBlockHashReference } from "./block-hash-reference.js";
import type { EthSimulatePayload, RpcSimulatedBlock } from "./types.js";

export type EthSimulateV1ByHashParameters = {
  /** Hash of the base block. */
  blockHash: BlockHash;
  /** Simulated blocks, calls, and overrides. */
  payload: EthSimulatePayload;
  /** Reject the request when the block is not canonical (EIP-1898). */
  requireCanonical?: boolean | undefined;
};

type Method = RpcMethodDefinition<
  "eth_simulateV1",
  readonly [EthSimulatePayload, BlockHashReference],
  readonly RpcSimulatedBlock[]
>;

export function ethSimulateV1ByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthSimulateV1ByHashParameters,
  requestOptions?: options,
): Promise<readonly RpcSimulatedBlock[]> {
  return client.request<Method>(
    {
      method: "eth_simulateV1",
      params: [
        parameters.payload,
        toBlockHashReference(parameters.blockHash, parameters.requireCanonical),
      ],
    },
    requestOptions,
  );
}
