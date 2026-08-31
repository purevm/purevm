import { TransportError } from "./TransportError.js";

export function isRetryableError(error: unknown): boolean {
  return error instanceof TransportError && error.retryable;
}
