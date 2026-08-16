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
export function createCancellationContext(
    options: CancellationOptions,
): CancellationContext {
    const {
        timeoutMs,
        signal: externalSignal,
    } = options

    const controller = new AbortController();
    let didTimeout = false;

    const abortFromExternal = () => {
        controller.abort(externalSignal?.reason);
    };

    if (externalSignal?.aborted) {
        abortFromExternal();
    } else {
        externalSignal?.addEventListener('abort', abortFromExternal, {
            once: true,
        });
    }

    const timeoutId =
        timeoutMs > 0
            ? setTimeout(() => {
                didTimeout = true
                controller.abort()
            }, timeoutMs)
            : undefined

    return {
        get signal() {
            return controller.signal;
        },
        get timeoutMs() {
            return timeoutMs;
        },
        get timedOut() {
            return didTimeout;
        },
        get aborted() {
            return controller.signal.aborted;
        },
        get abortedReason() {
            return controller.signal.reason;
        },
        dispose() {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            externalSignal?.removeEventListener('abort', abortFromExternal);
        },
    };
}
