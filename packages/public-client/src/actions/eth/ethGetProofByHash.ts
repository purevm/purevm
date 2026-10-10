import type { RequestOptions } from "@purevm/rpc-transport";

import type { Address, BlockHash, BlockHashReference, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toBlockHashReference } from "./block-hash-reference.js";
import type { RpcAccountProof } from "./types.js";

export type EthGetProofByHashParameters = {
  /** Account to prove. */
  address: Address;
  /** Hash of the state block. */
  blockHash: BlockHash;
  /** Reject the request when the block is not canonical (EIP-1898). */
  requireCanonical?: boolean | undefined;
  /** Storage slots to prove. Defaults to none. */
  storageKeys?: readonly Hex[] | undefined;
};

type Method = RpcMethodDefinition<
  "eth_getProof",
  readonly [Address, readonly Hex[], BlockHashReference],
  RpcAccountProof
>;

export function ethGetProofByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetProofByHashParameters,
  requestOptions?: options,
): Promise<RpcAccountProof> {
  return client.request<Method>(
    {
      method: "eth_getProof",
      params: [
        parameters.address,
        parameters.storageKeys ?? [],
        toBlockHashReference(parameters.blockHash, parameters.requireCanonical),
      ],
    },
    requestOptions,
  );
}
