import { HttpStatusError, RpcProviderError, RpcTimeoutError } from "@purevm/rpc-public";

// Rate limiting reuses words such as "limit" and "exceeded" (Infura even shares code -32005), so it
// is recognized first: splitting a rate-limited range would multiply requests instead of helping.
const RATE_LIMITED = /rate|too many requests|request count|capacity|throughput|credits|quota/i;

// Wording used by providers when a range query is too large.
const TOO_LARGE =
  /block range|range (?:is )?too (?:large|wide|big)|more than \d+|exceed|limit|response size|max(?:imum)? (?:results|range|blocks?)|too many (?:results|logs|blocks)/i;

/**
 * Whether a range request failed because of its size, so splitting it can succeed. Other failures
 * (authentication, rate limits, network) are not retried by splitting.
 */
export function isRangeTooLargeError(error: unknown): boolean {
  if (error instanceof RpcTimeoutError) return true;
  if (error instanceof HttpStatusError) return error.status === 413;
  if (!(error instanceof RpcProviderError)) return false;
  if (RATE_LIMITED.test(error.rpcMessage)) return false;
  return error.rpcCode === -32005 || TOO_LARGE.test(error.rpcMessage);
}
