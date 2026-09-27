import type { RequestOptions } from "@purevm/transports";

import type { BlockHash, BlockHashReference, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toBlockHashReference } from "./block-hash-reference.js";
import { toCallParams, type CallParams } from "./call-overrides.js";
import type { BlockOverrides, RpcCallRequest, StateOverride } from "./types.js";

export type EthCallByHashParameters = {
  /** Hash of the state block. */
  blockHash: BlockHash;
  /** Header fields replaced for the call. Supported by Geth and Reth. */
  blockOverrides?: BlockOverrides | undefined;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
  /** Reject the request when the block is not canonical (EIP-1898). */
  requireCanonical?: boolean | undefined;
  /** Account state replaced before the call. */
  stateOverrides?: StateOverride | undefined;
};

type Method = RpcMethodDefinition<"eth_call", CallParams<BlockHashReference>, Hex>;

export function ethCallByHash<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCallByHashParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    {
      method: "eth_call",
      params: toCallParams(
        parameters.call,
        toBlockHashReference(parameters.blockHash, parameters.requireCanonical),
        parameters.stateOverrides,
        parameters.blockOverrides,
      ),
    },
    requestOptions,
  );
}
