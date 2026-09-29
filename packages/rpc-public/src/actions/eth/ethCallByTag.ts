import type { RequestOptions } from "@purevm/rpc-transport";

import type { BlockTag, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toCallParams, type CallParams } from "./call-overrides.js";
import type { BlockOverrides, RpcCallRequest, StateOverride } from "./types.js";

export type EthCallByTagParameters = {
  /** Header fields replaced for the call. Supported by Geth and Reth. */
  blockOverrides?: BlockOverrides | undefined;
  /** Named state block, such as `latest` or `finalized`. */
  blockTag: BlockTag;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
  /** Account state replaced before the call. */
  stateOverrides?: StateOverride | undefined;
};

type Method = RpcMethodDefinition<"eth_call", CallParams<BlockTag>, Hex>;

export function ethCallByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCallByTagParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    {
      method: "eth_call",
      params: toCallParams(
        parameters.call,
        parameters.blockTag,
        parameters.stateOverrides,
        parameters.blockOverrides,
      ),
    },
    requestOptions,
  );
}
