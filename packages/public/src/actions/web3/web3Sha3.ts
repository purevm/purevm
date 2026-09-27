import type { RequestOptions } from "@purevm/transports";

import type { Hash, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<"web3_sha3", readonly [Hex], Hash>;

/** Returns the Keccak-256 hash of `data`, computed by the node. */
export function web3Sha3<options extends RequestOptions>(
  client: RpcRequester<options>,
  data: Hex,
  requestOptions?: options,
): Promise<Hash> {
  return client.request<Method>({ method: "web3_sha3", params: [data] }, requestOptions);
}
