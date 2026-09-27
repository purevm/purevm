import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Hex } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import { toCallParams, type CallParams } from "./call-overrides.js";
import type { BlockOverrides, RpcCallRequest, StateOverride } from "./types.js";

export type EthCallByNumberParameters = {
  /** Hex-encoded number of the state block. */
  blockNumber: BlockNumber;
  /** Header fields replaced for the call. Supported by Geth and Reth. */
  blockOverrides?: BlockOverrides | undefined;
  /** Transaction-like call to execute. */
  call: RpcCallRequest;
  /** Account state replaced before the call. */
  stateOverrides?: StateOverride | undefined;
};

type Method = RpcMethodDefinition<"eth_call", CallParams<BlockNumber>, Hex>;

export function ethCallByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: EthCallByNumberParameters,
  requestOptions?: options,
): Promise<Hex> {
  return client.request<Method>(
    {
      method: "eth_call",
      params: toCallParams(
        parameters.call,
        parameters.blockNumber,
        parameters.stateOverrides,
        parameters.blockOverrides,
      ),
    },
    requestOptions,
  );
}
