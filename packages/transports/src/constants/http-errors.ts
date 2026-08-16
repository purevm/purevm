/**
 * HTTP status codes a JSON-RPC node may return.
 */
export const HTTP_ERROR_CODE_MAP = {
    400: {
        name: 'BadRequestError',
        message: 'Bad Request',
    },
    401: {
        name: 'UnauthorizedError',
        message: 'Unauthorized',
    },
    403: {
        name: 'ForbiddenError',
        message: 'Forbidden',
    },
    404: {
        name: 'NotFoundError',
        message: 'Not Found',
    },
    405: {
        name: 'MethodNotAllowedError',
        message: 'Method Not Allowed',
    },
    408: {
        name: 'RequestTimeoutError',
        message: 'Request Timeout',
    },
    413: {
        name: 'ContentTooLargeError',
        message: 'Content Too Large',
    },
    429: {
        name: 'TooManyRequestsError',
        message: 'Too Many Requests',
    },
    500: {
        name: 'InternalServerError',
        message: 'Internal Server Error',
    },
    502: {
        name: 'BadGatewayError',
        message: 'Bad Gateway',
    },
    503: {
        name: 'ServiceUnavailableError',
        message: 'Service Unavailable',
    },
    504: {
        name: 'GatewayTimeoutError',
        message: 'Gateway Timeout',
    },
} as const;
