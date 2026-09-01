import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<
  "eth_getBlockTransactionCountByNumber",
  readonly [BlockNumber],
  Quantity
>;
export function ethGetBlockTransactionCountByNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockNumber: BlockNumber,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getBlockTransactionCountByNumber", params: [blockNumber] },
    requestOptions,
  );
}
