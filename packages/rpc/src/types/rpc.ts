import type { JsonValue, RequestOptions } from "@purevm/transports";

export type RpcMethodDefinition<
  method extends string = string,
  params extends readonly JsonValue[] | undefined = readonly JsonValue[] | undefined,
  result = unknown,
> = {
  /** Exact JSON-RPC method name. */
  method: method;
  /** Positional or named parameters accepted by the method. */
  params?: params;
  /** Response payload returned in the JSON-RPC result member. */
  result: result;
};

export interface RpcRequester<options extends RequestOptions = RequestOptions> {
  /** Sends a typed JSON-RPC call through the underlying transport. */
  request<method extends RpcMethodDefinition>(
    call: undefined extends method["params"]
      ? { method: method["method"]; params?: method["params"] }
      : { method: method["method"]; params: method["params"] },
    options?: options,
  ): Promise<method["result"]>;
}
