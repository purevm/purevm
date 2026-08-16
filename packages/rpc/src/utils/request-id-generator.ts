// ===========================================================
// Types
// ===========================================================

export type RequestIdGenerator = {
    /** Returns the next request ID. */
    next: () => number;
    /** Returns the current request ID. */
    current: () => number;
    /** Resets the request ID. */
    reset: () => void;
};

// ===========================================================
// Functions
// ===========================================================

/**
 * Creates a request ID generator.
 */
export function createRequestIdGenerator(): RequestIdGenerator {
    let requestId = 0;

    return {
        next: () => {
            requestId += 1;

            if (requestId > Number.MAX_SAFE_INTEGER) {
                requestId = 1;
            }

            return requestId;
        },

        current: () => {
            return requestId;
        },

        reset: () => {
            requestId = 0;
        },
    };
}