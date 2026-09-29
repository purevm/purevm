export type JsonPrimitive = boolean | null | number | string;

/** Object members set to `undefined` are omitted by `JSON.stringify`, so they are accepted. */
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

export type RpcId = number | string | null;

export type RpcParams = readonly JsonValue[] | { readonly [key: string]: JsonValue | undefined };

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
  retries?: number | undefined;
  delayMs?: number | undefined;
  maxDelayMs?: number | undefined;
  factor?: number | undefined;
  shouldRetry?: ((error: unknown, attempt: number) => boolean) | undefined;
};

export type TransportOptions = {
  timeoutMs?: number | undefined;
  retry?: false | RetryOptions | undefined;
};

export type RequestOptions = {
  signal?: AbortSignal | undefined;
  timeoutMs?: number | undefined;
  retry?: false | RetryOptions | undefined;
};

export type Transport = {
  request<method extends RpcMethod>(
    call: RpcCall<method>,
    options?: RequestOptions,
  ): Promise<method["result"]>;
};
