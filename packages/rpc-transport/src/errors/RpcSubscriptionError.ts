import { RpcResponseError } from "./RpcResponseError.js";

export class RpcSubscriptionError extends RpcResponseError {
  constructor(message: string, response: unknown, cause?: unknown) {
    super(message, response, cause, "RPC_SUBSCRIPTION");
  }
}

export { RpcSubscriptionError as SubscriptionError };
