// ============================================================
// Functions
// ============================================================

/** 
 * Coerce an unknown thrown value into a real Error (preserving messages). 
 */
export function normalizeError(err: unknown, fallbackMessage: string): Error {
    if (err instanceof Error) {
        return err;
    }
    if (typeof err === "string") {
        return new Error(err);
    }
    try {
        return new Error(`${fallbackMessage}: ${JSON.stringify(err)}`);
    } catch {
        return new Error(fallbackMessage);
    }
}

/**
 * Checks whether an error is an abort error.
 */
export function isAbortError(
    error: unknown,
): error is Error & { name: 'AbortError' } {
    return (
        typeof error === 'object'
        && error !== null
        && 'name' in error
        && error.name === 'AbortError'
    );
}