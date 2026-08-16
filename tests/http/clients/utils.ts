// ============================================================
// Utils
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
 * Trim oversized response bodies before embedding them in error messages. 
 */
export function truncate(text: string, max: number = 512): string {
    if (text.length <= max) {
        return text;
    }
    return `${text.slice(0, max)}… (${text.length} bytes)`;
}
