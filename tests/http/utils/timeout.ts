// ===========================================================
// Types
// ===========================================================

export type TimeoutMs = number;

// ===========================================================
// Constants
// ===========================================================

/** The minimum timeout in milliseconds. */
const MIN_TIMEOUT_MS = 1_000;

/** The maximum timeout in milliseconds. */
const MAX_TIMEOUT_MS = 60_000;

// ===========================================================
// Functions
// ===========================================================

/**
 * Validates a timeout in milliseconds and returns it if it is valid.
 */
export function getTimeout(timeoutMs: number): TimeoutMs {
    if (
        !Number.isSafeInteger(timeoutMs)
        || timeoutMs < MIN_TIMEOUT_MS
        || timeoutMs > MAX_TIMEOUT_MS
    ) {
        throw new Error(
            `Please provide a valid timeout in milliseconds (positive integer between ${MIN_TIMEOUT_MS}ms and ${MAX_TIMEOUT_MS}ms)`
        );
    }
    return timeoutMs;
}
