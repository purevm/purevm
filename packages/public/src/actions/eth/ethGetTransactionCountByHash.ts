import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockHash, BlockHashReference, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toBlockHashReference } from "./block-hash-reference.js";

export type EthGetTransactionCountByHashParameters = {
  /** Account whose nonce should be read. */
  address: Address;
  /** Hash of the state block. */
  blockHash: BlockHash;
  /** Reject the request when the block is not canonical (EIP-1898). */
  requireCanonical?: boolean | undefined;
};

type Method = RpcMethodDefinition<
  "eth_getTransactionCount",
  readonly [Address, BlockHashReference],
  Quantity
>;

export function ethGetTransactionCountByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetTransactionCountByHashParameters,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    {
      method: "eth_getTransactionCount",
      params: [
        parameters.address,
        toBlockHashReference(parameters.blockHash, parameters.requireCanonical),
      ],
    },
    requestOptions,
  );
}
