import type { RequestOptions } from "@purevm/transports";

import type { Address } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";
import type { TxpoolContentFrom } from "./types.js";

type Method = RpcMethodDefinition<"txpool_contentFrom", readonly [Address], TxpoolContentFrom>;

/** Returns the pending and queued transactions sent from `address`, keyed by nonce. */
export function txpoolContentFrom<options extends RequestOptions>(
  client: RpcRequester<options>,
  address: Address,
  requestOptions?: options,
): Promise<TxpoolContentFrom> {
  return client.request<Method>(
    { method: "txpool_contentFrom", params: [address] },
    requestOptions,
  );
}
