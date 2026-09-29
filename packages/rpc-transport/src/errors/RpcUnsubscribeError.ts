import { RpcResponseError } from "./RpcResponseError.js";

export class RpcUnsubscribeError extends RpcResponseError {
  constructor(message: string, response: unknown, cause?: unknown) {
    super(message, response, cause, "RPC_UNSUBSCRIBE");
  }
}

export { RpcUnsubscribeError as UnsubscribeError };
