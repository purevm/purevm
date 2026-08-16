// ===========================================================
// Types
// ===========================================================

export type TimeoutMs = number;

// ===========================================================
// Functions
// ===========================================================

/**
 * Validates a timeout in milliseconds and returns it if it is valid.
 */
export function getTimeout(timeoutMs: number, minTimeoutMs = 1_000, maxTimeoutMs = 60_000): TimeoutMs {
    if (
        !Number.isSafeInteger(timeoutMs)
        || timeoutMs < minTimeoutMs
        || timeoutMs > maxTimeoutMs
    ) {
        throw new Error(
            `Please provide a valid timeout in milliseconds (positive integer between ${minTimeoutMs}ms and ${maxTimeoutMs}ms)`
        );
    }
    return timeoutMs;
}
