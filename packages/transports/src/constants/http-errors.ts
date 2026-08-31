export const HTTP_ERROR_CODE_MAP = {
  400: { message: "Bad Request", name: "BadRequestError" },
  401: { message: "Unauthorized", name: "UnauthorizedError" },
  403: { message: "Forbidden", name: "ForbiddenError" },
  404: { message: "Not Found", name: "NotFoundError" },
  405: { message: "Method Not Allowed", name: "MethodNotAllowedError" },
  408: { message: "Request Timeout", name: "RequestTimeoutError" },
  413: { message: "Content Too Large", name: "ContentTooLargeError" },
  429: { message: "Too Many Requests", name: "TooManyRequestsError" },
  500: { message: "Internal Server Error", name: "InternalServerError" },
  502: { message: "Bad Gateway", name: "BadGatewayError" },
  503: { message: "Service Unavailable", name: "ServiceUnavailableError" },
  504: { message: "Gateway Timeout", name: "GatewayTimeoutError" },
  520: { message: "Unknown Error", name: "UnknownServerError" },
  521: { message: "Web Server Is Down", name: "WebServerDownError" },
  522: { message: "Connection Timed Out", name: "ConnectionTimedOutError" },
  523: { message: "Origin Is Unreachable", name: "OriginUnreachableError" },
  524: { message: "A Timeout Occurred", name: "EdgeTimeoutError" },
} as const;

export const RETRYABLE_HTTP_STATUS_CODES = [
  408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524,
] as const;

export type HttpErrorCode = keyof typeof HTTP_ERROR_CODE_MAP;
export type HttpErrorDefinition = (typeof HTTP_ERROR_CODE_MAP)[HttpErrorCode];
export type HttpErrorName = HttpErrorDefinition["name"];
export type RetryableHttpStatusCode = (typeof RETRYABLE_HTTP_STATUS_CODES)[number];

const httpErrors: Readonly<Partial<Record<number, HttpErrorDefinition>>> = HTTP_ERROR_CODE_MAP;
const retryableStatuses: ReadonlySet<number> = new Set(RETRYABLE_HTTP_STATUS_CODES);

export function getHttpErrorDefinition(status: number): HttpErrorDefinition | undefined {
  return httpErrors[status];
}

export function isRetryableHttpStatus(status: number): status is RetryableHttpStatusCode {
  return retryableStatuses.has(status);
}
