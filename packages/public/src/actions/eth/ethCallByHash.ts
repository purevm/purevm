import type { RequestOptions } from "@purevm/transports";

import type { BlockHash, BlockHashReference, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toBlockHashReference } from "./block-hash-reference.js";
import type { RpcCallRequest } from "./types.js";

export type EthCallByHashParameters = {
  /** Hash of the state block. */
  blockHash: BlockHash;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
  /** Reject the request when the block is not canonical (EIP-1898). */
  requireCanonical?: boolean | undefined;
};

type Method = RpcMethodDefinition<"eth_call", readonly [RpcCallRequest, BlockHashReference], Hex>;

export function ethCallByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCallByHashParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    {
      method: "eth_call",
      params: [
        parameters.call,
        toBlockHashReference(parameters.blockHash, parameters.requireCanonical),
      ],
    },
    requestOptions,
  );
}
