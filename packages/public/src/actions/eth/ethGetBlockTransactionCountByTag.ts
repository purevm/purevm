import type { RequestOptions } from "@purevm/transports";

import type { BlockTag, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<
  "eth_getBlockTransactionCountByNumber",
  readonly [BlockTag],
  Quantity
>;
export function ethGetBlockTransactionCountByTag<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockTag: BlockTag,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getBlockTransactionCountByNumber", params: [blockTag] },
    requestOptions,
  );
}
