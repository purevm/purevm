import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockHash, BlockHashReference, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toBlockHashReference } from "./block-hash-reference.js";

export type EthGetBalanceByHashParameters = {
  /** Account whose balance should be read. */
  address: Address;
  /** Hash of the state block. */
  blockHash: BlockHash;
  /** Reject the request when the block is not canonical (EIP-1898). */
  requireCanonical?: boolean | undefined;
};

type Method = RpcMethodDefinition<
  "eth_getBalance",
  readonly [Address, BlockHashReference],
  Quantity
>;

export function ethGetBalanceByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetBalanceByHashParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    {
      method: "eth_getBalance",
      params: [
        parameters.address,
        toBlockHashReference(parameters.blockHash, parameters.requireCanonical),
      ],
    },
    requestOptions,
  );
}
