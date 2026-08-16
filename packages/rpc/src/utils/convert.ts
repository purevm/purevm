// ===========================================================
// Types
// ===========================================================

export type CancellationOptions = {
    timeoutMs: number;
    signal?: AbortSignal | undefined;
}

export type CancellationContext = {
    readonly signal: AbortSignal;
    readonly timeoutMs: number;
    readonly timedOut: boolean;
    readonly aborted: boolean;
    readonly abortedReason: unknown;
    dispose: () => void;
}

// ===========================================================
// Functions
// ===========================================================

/**
 * Creates cancellation state for a request with a timeout.
 */
export function numberToHex(value: number): `0x${string}` {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error("Expected a positive safe integer.");
    }

    return `0x${value.toString(16)}`;
}

export function hexToNumber(value: `0x${string}`): number {
    return Number.parseInt(value, 16);
}

export function hexToBigInt(value: `0x${string}`): bigint {
    return BigInt(value);
}

export function bigintToHex(value: bigint): `0x${string}` {
    if (value < 0n) {
        throw new Error("Expected a positive bigint.");
    }

    return `0x${value.toString(16)}`;
}