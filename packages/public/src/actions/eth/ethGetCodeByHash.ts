import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockHash, BlockHashReference, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toBlockHashReference } from "./block-hash-reference.js";

export type EthGetCodeByHashParameters = {
  /** Account whose deployed bytecode should be read. */
  address: Address;
  /** Hash of the state block. */
  blockHash: BlockHash;
  /** Reject the request when the block is not canonical (EIP-1898). */
  requireCanonical?: boolean | undefined;
};

type Method = RpcMethodDefinition<"eth_getCode", readonly [Address, BlockHashReference], Hex>;

export function ethGetCodeByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetCodeByHashParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    {
      method: "eth_getCode",
      params: [
        parameters.address,
        toBlockHashReference(parameters.blockHash, parameters.requireCanonical),
      ],
    },
    requestOptions,
  );
}
