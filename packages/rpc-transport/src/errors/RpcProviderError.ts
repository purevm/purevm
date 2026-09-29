import {
  getRpcErrorDefinition,
  isRetryableRpcErrorCode,
  type KnownRpcErrorName,
} from "../constants/index.js";
import type { RpcErrorObject } from "../types.js";
import { TransportError } from "./TransportError.js";

export class RpcProviderError extends TransportError {
  readonly rpcCode: number;
  readonly rpcData: unknown;
  readonly rpcMessage: string;
  readonly rpcName: KnownRpcErrorName | undefined;

  constructor(error: RpcErrorObject) {
    const definition = getRpcErrorDefinition(error.code);
    super(`RPC error ${error.code}: ${error.message}`, {
      cause: error,
      code: "RPC_PROVIDER",
      retryable: isRetryableRpcErrorCode(error.code),
    });
    this.rpcCode = error.code;
    this.rpcData = error.data;
    this.rpcMessage = error.message;
    this.rpcName = definition?.name;
  }
}
