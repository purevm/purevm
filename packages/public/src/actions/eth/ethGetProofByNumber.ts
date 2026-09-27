import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumber, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcAccountProof } from "./types.js";

export type EthGetProofByNumberParameters = {
  /** Account to prove. */
  address: Address;
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
  /** Storage slots to prove. Defaults to none. */
  storageKeys?: readonly Hex[] | undefined;
};

type Method = RpcMethodDefinition<
  "eth_getProof",
  readonly [Address, readonly Hex[], BlockNumber],
  RpcAccountProof
>;

export function ethGetProofByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetProofByNumberParameters,
  requestOptions?: options,
): Promise<RpcAccountProof> {
  return client.request<Method>(
    {
      method: "eth_getProof",
      params: [parameters.address, parameters.storageKeys ?? [], parameters.blockNumber],
    },
    requestOptions,
  );
}
