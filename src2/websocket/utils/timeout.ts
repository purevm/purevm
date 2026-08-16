// ===========================================================
// Types
// ===========================================================

export type TimeoutMs = number;

// ===========================================================
// Constants
// ===========================================================

const MIN_TIMEOUT_MS = 1;
const MAX_TIMEOUT_MS = 120_000;

// ===========================================================
// Functions
// ===========================================================

export function getTimeout(timeoutMs: number): TimeoutMs {
    if (
        !Number.isSafeInteger(timeoutMs) ||
        timeoutMs < MIN_TIMEOUT_MS ||
        timeoutMs > MAX_TIMEOUT_MS
    ) {
        throw new Error(
            `Please provide a timeout between ${MIN_TIMEOUT_MS}ms and ${MAX_TIMEOUT_MS}ms`,
        );
    }
    return timeoutMs;
}
