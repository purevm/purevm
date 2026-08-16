/**
 * List of HTTP status codes considered retryable for JSON-RPC clients.
 * Includes standard transient errors and common edge/cloud provider errors.
 */
export const RETRYABLE_HTTP_STATUS_CODES = [
    // Standard timeout and unavailability
    408, // Request Timeout
    429, // Too Many Requests (Rate limited)
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
    // Cloudflare and similar edge/server errors (5xx+)
    520, // Cloudflare: Unknown Error
    521, // Cloudflare: Web Server Is Down
    522, // Cloudflare: Connection Timed Out
    523, // Cloudflare: Origin Is Unreachable
    524  // Cloudflare: A Timeout Occurred
] as const;

/**
 * Type representing all retryable HTTP status codes.
 */
export type RetryableHttpStatusCode = typeof RETRYABLE_HTTP_STATUS_CODES[number];

/**
 * Predicate function to check if a status is retryable.
 */
export function isRetryableHttpStatus(code: number): code is RetryableHttpStatusCode {
    return (RETRYABLE_HTTP_STATUS_CODES as readonly number[]).includes(code);
}