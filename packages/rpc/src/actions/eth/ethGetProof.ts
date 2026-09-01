import type { RequestOptions } from "@purevm/transports";

import type { Address, BlockNumberOrTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { RpcAccountProof } from "./types.js";

export type EthGetProofParameters = {
  address: Address;
  block?: BlockNumberOrTag;
  storageKeys?: readonly Hex[];
};
type EthGetProof = RpcMethodDefinition<
  "eth_getProof",
  readonly [Address, readonly Hex[], BlockNumberOrTag],
  RpcAccountProof
>;

export function ethGetProof<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthGetProofParameters,
  requestOptions?: options,
): Promise<RpcAccountProof> {
  return client.request<EthGetProof>(
    {
      method: "eth_getProof",
      params: [parameters.address, parameters.storageKeys ?? [], parameters.block ?? "latest"],
    },
    requestOptions,
  );
}
