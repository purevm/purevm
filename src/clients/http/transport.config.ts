import { getTimeout, type TimeoutMs } from "../../utils/timeout.js";
import type { TransportParameters } from "./transport.types.js";
import { parseHttpUrl, type HttpUrl, type HttpsUrl } from "./utils/url.js";
import { getHttpHeaders } from "./utils/headers.js";

/**
 * Parameters manager for the HTTP transport
 */
export class TransportParametersManager {
    /** The url of the transport */
    public readonly url: HttpUrl | HttpsUrl;
    /** Additional headers sent with every request. */
    public readonly headers: Headers;
    /** The timeout for the transport */
    public readonly timeoutMs: TimeoutMs;
    
    /**
     * Constructor for the TransportParametersManager.
     * @param parameters The parameters for the transport @see TransportParameters
     */
    constructor(
        parameters: TransportParameters
    ) {
        const parsedUrl = parseHttpUrl(parameters.url);
        this.url = parsedUrl.url;
        this.headers = getHttpHeaders(parsedUrl.headers, parameters.headers);
        this.timeoutMs = getTimeout(parameters.timeoutMs);
    }
}
