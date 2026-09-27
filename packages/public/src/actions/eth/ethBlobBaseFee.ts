import type { RequestOptions } from "@purevm/transports";

import type { Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type EthBlobBaseFee = RpcMethodDefinition<"eth_blobBaseFee", undefined, Quantity>;

export function ethBlobBaseFee<options extends RequestOptions>(
  client: RpcRequester<options>,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<EthBlobBaseFee>({ method: "eth_blobBaseFee" }, requestOptions);
}
