import type { RequestOptions } from "@purevm/transports";

import type { BlockNumber, Quantity } from "../../types/primitives.js";
import type { RpcMethodDefinition, RpcRequester } from "../../types/rpc.js";

type Method = RpcMethodDefinition<
  "eth_getUncleCountByBlockNumber",
  readonly [BlockNumber],
  Quantity
>;
export function ethGetUncleCountByBlockNumber<options extends RequestOptions>(
  client: RpcRequester<options>,
  blockNumber: BlockNumber,
  requestOptions?: options,
): Promise<Quantity> {
  return client.request<Method>(
    { method: "eth_getUncleCountByBlockNumber", params: [blockNumber] },
    requestOptions,
  );
}
