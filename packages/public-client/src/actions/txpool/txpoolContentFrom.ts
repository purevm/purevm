import type { RequestOptions } from "@purevm/rpc-transport";

import type { Address } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TxpoolContentFrom } from "./types.js";

export type TxpoolContentFromParameters = {
  /** Sender whose pool transactions should be returned. */
  address: Address;
};

type Method = RpcMethodDefinition<"txpool_contentFrom", readonly [Address], TxpoolContentFrom>;

/** Returns the pending and queued transactions sent from `address`, keyed by nonce. */
export function txpoolContentFrom<options extends RequestOptions>(
  client: RpcRequester<options>,
  parameters: TxpoolContentFromParameters,
  requestOptions?: options,
): Promise<TxpoolContentFrom> {
  return client.request<Method>(
    { method: "txpool_contentFrom", params: [parameters.address] },
    requestOptions,
  );
}
