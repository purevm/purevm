import type { RequestOptions } from "@purevm/rpc-transport";

import type {
  Address,
  BlockHash,
  BlockHashReference,
  Hex,
  Quantity,
} from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toBlockHashReference } from "./block-hash-reference.js";

export type EthGetStorageAtByHashParameters = {
  /** Contract whose storage should be read. */
  address: Address;
  /** Hash of the state block. */
  blockHash: BlockHash;
  /** Storage slot index. */
  position: Quantity;
  /** Reject the request when the block is not canonical (EIP-1898). */
  requireCanonical?: boolean | undefined;
};

type Method = RpcMethodDefinition<
  "eth_getStorageAt",
  readonly [Address, Quantity, BlockHashReference],
  Hex
>;

export function ethGetStorageAtByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetStorageAtByHashParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    {
      method: "eth_getStorageAt",
      params: [
        parameters.address,
        parameters.position,
        toBlockHashReference(parameters.blockHash, parameters.requireCanonical),
      ],
    },
    requestOptions,
  );
}
