// ===========================================================
// Types
// ===========================================================

export type HttpUrl = `http://${string}`;

export type HttpsUrl = `https://${string}`;

// ===========================================================
// Functions
// ===========================================================

/**
 * Parsed HTTP endpoint with credentials stripped from the URL.
 */
export type ParsedHttpUrl = {
    url: HttpUrl | HttpsUrl
    headers?: { authorization: string } | undefined
}

/**
 * Validates an HTTP or HTTPS URL, strips embedded Basic auth credentials,
 * and returns those credentials as an `Authorization` header.
 */
export function parseHttpUrl(url: string | HttpUrl | HttpsUrl): ParsedHttpUrl {
    if (url.trim() !== url) {
        throw new Error('Please provide a valid url (without whitespace)');
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error('Please provide a valid url (http:// or https://)');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Please provide a valid url (http:// or https://)');
    }

    if (!parsedUrl.hostname) {
        throw new Error('Please provide a valid url with a hostname');
    }

    if (!parsedUrl.username && !parsedUrl.password) {
        return { url: url as HttpUrl | HttpsUrl };
    }

    const credentials = `${decodeURIComponent(parsedUrl.username)}:${decodeURIComponent(parsedUrl.password)}`;
    parsedUrl.username = '';
    parsedUrl.password = '';

    return {
        url: parsedUrl.toString() as HttpUrl | HttpsUrl,
        headers: {
            authorization: `Basic ${btoa(credentials)}`,
        },
    };
}

/**
 * Validates a HTTP or HTTPS URL and returns it with credentials stripped.
 */
export function getHttpUrl(url: string | HttpUrl | HttpsUrl): HttpUrl | HttpsUrl {
    return parseHttpUrl(url).url;
}
