import type { RequestOptions } from "@purevm/rpc-transport";

import type { Address, BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcAccountProof } from "./types.js";

export type EthGetProofByTagParameters = {
  /** Account to prove. */
  address: Address;
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Storage slots to prove. Defaults to none. */
  storageKeys?: readonly Hex[] | undefined;
};

type Method = RpcMethodDefinition<
  "eth_getProof",
  readonly [Address, readonly Hex[], BlockTag],
  RpcAccountProof
>;

export function ethGetProofByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetProofByTagParameters,
  requestOptions?: options,
): Promise<RpcAccountProof> {
  return client.request<Method>(
    {
      method: "eth_getProof",
      params: [parameters.address, parameters.storageKeys ?? [], parameters.blockTag],
    },
    requestOptions,
  );
}
