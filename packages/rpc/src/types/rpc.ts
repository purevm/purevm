import type { JsonValue, RequestOptions } from "@purevm/transports";

export type RpcMethodDefinition<
  method extends string = string,
  params extends readonly JsonValue[] | undefined = readonly JsonValue[] | undefined,
  result = unknown,
> = {
  method: method;
  params?: params;
  result: result;
};

export interface RpcRequester<options extends RequestOptions = RequestOptions> {
  request<method extends RpcMethodDefinition>(
    call: undefined extends method["params"]
      ? { method: method["method"]; params?: method["params"] }
      : { method: method["method"]; params: method["params"] },
    options?: options,
  ): Promise<method["result"]>;
}
