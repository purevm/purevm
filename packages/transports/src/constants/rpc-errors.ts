/**
 * Standardized JSON-RPC error codes from [viem](https://viem.sh).
 */
export const RPC_ERROR_CODE_MAP = {
    [-32700]: {
        name: 'ParseRpcError',
        message: 'Invalid JSON was received by the server.',
    },
    [-32600]: {
        name: 'InvalidRequestRpcError',
        message: 'JSON is not a valid request object.',
    },
    [-32601]: {
        name: 'MethodNotFoundRpcError',
        message: 'The method does not exist or is not available.',
    },
    [-32602]: {
        name: 'InvalidParamsRpcError',
        message: 'Invalid parameters were provided to the RPC method.',
    },
    [-32603]: {
        name: 'InternalRpcError',
        message: 'An internal error was received.',
    },
    [-32042]: {
        name: 'MethodNotFoundRpcError',
        message: 'The method does not exist or is not available.',
    },
    [-32000]: {
        name: 'InvalidInputRpcError',
        message: 'Missing or invalid parameters.',
    },
    [-32001]: {
        name: 'ResourceNotFoundRpcError',
        message: 'Requested resource not found.',
    },
    [-32002]: {
        name: 'ResourceUnavailableRpcError',
        message: 'Requested resource not available.',
    },
    [-32003]: {
        name: 'TransactionRejectedRpcError',
        message: 'Transaction creation failed.',
    },
    [-32004]: {
        name: 'MethodNotSupportedRpcError',
        message: 'Method is not supported.',
    },
    [-32005]: {
        name: 'LimitExceededRpcError',
        message: 'Request exceeds defined limit.',
    },
    [-32006]: {
        name: 'JsonRpcVersionUnsupportedError',
        message: 'Version of JSON-RPC protocol is not supported.',
    },
    [-1]: {
        name: 'UnknownRpcError',
        message: 'An unknown RPC error occurred.',
    },
} as const;
