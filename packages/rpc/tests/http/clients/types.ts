// ============================================================
// JSON-RPC 2.0
// ============================================================

export type RpcMethod = {
    Method: string;
    Parameters?: readonly unknown[] | Record<string, unknown>;
    ReturnType: unknown;
};

export type RpcRequest = {
    id: number | null;
    jsonrpc: "2.0";
    method: string;
    params?: readonly unknown[] | Record<string, unknown>;
};

export type RpcError = {
    code: number;
    message: string;
    data?: unknown | undefined;
};

export type RpcResponseSuccess<TResult = unknown> = {
    id: number | string | null;
    jsonrpc: "2.0";
    result: TResult;
    error?: undefined;
};

export type RpcResponseError<TError = RpcError> = {
    id: number | string | null;
    jsonrpc: "2.0";
    result?: undefined;
    error: TError;
};

// ============================================================
// RPC Types
// ============================================================

export type RpcResponse<TResult = unknown> =
    | RpcResponseSuccess<TResult>
    | RpcResponseError;

export type RpcCall<T extends RpcMethod> =
    T extends { Parameters: infer TParameters }
        ? {
            method: T["Method"];
            params: TParameters;
        }
        : {
            method: T["Method"];
            params?: undefined;
        };
