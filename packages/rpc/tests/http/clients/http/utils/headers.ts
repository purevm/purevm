// ===========================================================
// Types
// ===========================================================

export type HttpHeadersInit = ConstructorParameters<typeof Headers>[0];

// ===========================================================
// Functions
// ===========================================================

/**
 * Creates a normalized snapshot of HTTP headers.
 */
export function getHttpHeaders(init?: HttpHeadersInit): Headers {
    const headers = new Headers(init);

    if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
    }
    
    return headers;
}