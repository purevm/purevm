// ===========================================================
// Types
// ===========================================================

export type HttpHeadersInit = ConstructorParameters<typeof Headers>[0];

// ===========================================================
// Functions
// ===========================================================

/**
 * Creates a normalized snapshot of HTTP headers.
 *
 * Later values override earlier ones. `content-type` defaults to
 * `application/json` when no source sets it.
 */
export function getHttpHeaders(...inits: (HttpHeadersInit | undefined)[]): Headers {
    const headers = new Headers();

    for (const init of inits) {
        if (!init) continue;
        new Headers(init).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
    }

    return headers;
}