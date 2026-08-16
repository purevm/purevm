// ===========================================================
// Types
// ===========================================================

export type HttpUrl = `http://${string}`;

export type HttpsUrl = `https://${string}`;

// ===========================================================
// Functions
// ===========================================================

/**
 * Validates a HTTP or HTTPS URL and returns it if it is valid.
 */
export function getHttpUrl(url: string | HttpUrl | HttpsUrl): HttpUrl | HttpsUrl {
    const trimmedUrl = url.trim();

    if (trimmedUrl !== url) {
        throw new Error(
            'Please provide a valid provider url (without leading or trailing whitespace)'
        );
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error(
            'Please provide a valid provider url (http:// or https://)'
        );
    }

    if (
        parsedUrl.protocol !== 'http:'
        && parsedUrl.protocol !== 'https:'
    ) {
        throw new Error(
            'Please provide a valid provider url (http:// or https://)'
        );
    }

    if (!parsedUrl.hostname) {
        throw new Error(
            'Please provide a valid provider url with a hostname'
        );
    }

    return url as HttpUrl | HttpsUrl;
}
