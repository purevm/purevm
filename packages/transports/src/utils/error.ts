/** 
 * Normalize unknown thrown values into Error instances
 * @param error - The error to normalize
 * @param fallbackMessage - The fallback message to use if the error is not an Error or a string
 * @returns The normalized error
 */
export function normalizeError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error) {
        return error;
    }
    if (typeof error === "string" && error.length > 0) {
        return new Error(error);
    }
    return new Error(fallbackMessage);
}
