/**
 * Standardized JSON-RPC error codes as object keys from viem.
 */
export const JSON_RPC_ERROR_CODE_MAP = {
    // Standard JSON-RPC 2.0 errors
    [-32700]: "ParseRpcError",                           // Invalid JSON was received by the server.
    [-32600]: "InvalidRequestRpcError",                  // JSON is not a valid request object.
    [-32601]: "MethodNotFoundRpcError",                  // Method does not exist / is not available.
    [-32602]: "InvalidParamsRpcError",                   // Invalid parameters were provided.
    [-32603]: "InternalRpcError",                        // Internal error was received.
    [-32000]: "InvalidInputRpcError",                    // Missing or invalid parameters.
    [-32001]: "ResourceNotFoundRpcError",                // Requested resource not found.
    [-32002]: "ResourceUnavailableRpcError",             // Requested resource not available.
    [-32003]: "TransactionRejectedRpcError",             // Transaction creation failed.
    [-32004]: "MethodNotSupportedRpcError",              // Method is not supported.
    [-32005]: "LimitExceededRpcError",                   // Request exceeds defined limit.
    [-32006]: "JsonRpcVersionUnsupportedError",          // JSON-RPC protocol version not supported.
    // EIP-1193 / Wallet/Provider specific codes
    [4001]: "UserRejectedRequestError",                 // User rejected the request.
    [4100]: "UnauthorizedProviderError",                // Requested method/account not authorized.
    [4200]: "UnsupportedProviderMethodError",           // Provider does not support the requested method.
    [4900]: "ProviderDisconnectedError",                // Provider disconnected from all chains.
    [4901]: "ChainDisconnectedError",                   // Provider not connected to requested chain.
    [4902]: "SwitchChainError",                         // Error while attempting to switch chain.
    // Wallet capability errors
    [5700]: "UnsupportedNonOptionalCapabilityError",    // Wallet lacks a required non-optional capability.
    [5710]: "UnsupportedChainIdError",                  // Wallet does not support requested chain ID.
    [5720]: "DuplicateIdError",                         // Bundle already submitted with this ID.
    [5730]: "UnknownBundleIdError",                     // Bundle ID is unknown / not submitted.
    [5740]: "BundleTooLargeError",                      // Call bundle too large for wallet to process.
    [5750]: "AtomicReadyWalletRejectedUpgradeError",    // Wallet could support atomicity after upgrade, but user rejected upgrade.
    [5760]: "AtomicityNotSupportedError",               // Wallet does not support required atomic execution.
    // Session/connection errors
    [7000]: "WalletConnectSessionSettlementError",      // WalletConnect session settlement failed.
    // Fallback/unknown error codes
    [-1]: "UnknownRpcError",                            // viem's unknown fallback code for RpcError.
} as const;
