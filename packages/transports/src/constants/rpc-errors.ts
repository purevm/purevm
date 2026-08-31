export const RPC_ERROR_CODE_MAP = {
  [-32700]: { message: "Invalid JSON was received by the server.", name: "ParseRpcError" },
  [-32600]: { message: "JSON is not a valid request object.", name: "InvalidRequestRpcError" },
  [-32601]: {
    message: "The method does not exist or is not available.",
    name: "MethodNotFoundRpcError",
  },
  [-32602]: {
    message: "Invalid parameters were provided to the RPC method.",
    name: "InvalidParamsRpcError",
  },
  [-32603]: { message: "An internal error was received.", name: "InternalRpcError" },
  [-32042]: {
    message: "The method does not exist or is not available.",
    name: "MethodNotFoundRpcError",
  },
  [-32000]: { message: "Missing or invalid parameters.", name: "InvalidInputRpcError" },
  [-32001]: { message: "Requested resource not found.", name: "ResourceNotFoundRpcError" },
  [-32002]: {
    message: "Requested resource not available.",
    name: "ResourceUnavailableRpcError",
  },
  [-32003]: { message: "Transaction creation failed.", name: "TransactionRejectedRpcError" },
  [-32004]: { message: "Method is not supported.", name: "MethodNotSupportedRpcError" },
  [-32005]: { message: "Request exceeds defined limit.", name: "LimitExceededRpcError" },
  [-32006]: {
    message: "Version of JSON-RPC protocol is not supported.",
    name: "JsonRpcVersionUnsupportedError",
  },
  [-1]: { message: "An unknown RPC error occurred.", name: "UnknownRpcError" },
} as const;

export const RETRYABLE_RPC_ERROR_CODES = [-1, -32603, -32002, -32005, 429] as const;

export type KnownRpcErrorCode = keyof typeof RPC_ERROR_CODE_MAP;
export type KnownRpcErrorDefinition = (typeof RPC_ERROR_CODE_MAP)[KnownRpcErrorCode];
export type KnownRpcErrorName = KnownRpcErrorDefinition["name"];
export type RetryableRpcErrorCode = (typeof RETRYABLE_RPC_ERROR_CODES)[number];

const rpcErrors: Readonly<Partial<Record<number, KnownRpcErrorDefinition>>> = RPC_ERROR_CODE_MAP;
const retryableCodes: ReadonlySet<number> = new Set(RETRYABLE_RPC_ERROR_CODES);

export function getRpcErrorDefinition(code: number): KnownRpcErrorDefinition | undefined {
  return rpcErrors[code];
}

export function isRetryableRpcErrorCode(code: number): code is RetryableRpcErrorCode {
  return retryableCodes.has(code);
}
