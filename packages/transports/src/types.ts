export type JsonPrimitive = boolean | null | number | string;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type RpcId = number | string | null;

export type RpcParams = readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type RpcMethod = {
  method: string;
  params?: RpcParams | undefined;
  result: unknown;
};

export type RpcCall<method extends RpcMethod> = {
  method: method["method"];
} & (undefined extends method["params"]
  ? { params?: method["params"] | undefined }
  : { params: method["params"] });

export type RpcRequest = {
  id: number;
  jsonrpc: "2.0";
  method: string;
  params?: RpcParams | undefined;
};

export type RpcErrorObject = {
  code: number;
  message: string;
  data?: unknown;
};

export type RetryOptions = {
  retries?: number;
  delayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

export type TransportOptions = {
  timeoutMs?: number;
  retry?: false | RetryOptions;
};

export type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  retry?: false | RetryOptions;
};

export interface Transport {
  request<method extends RpcMethod>(
    call: RpcCall<method>,
    options?: RequestOptions,
  ): Promise<method["result"]>;
}
