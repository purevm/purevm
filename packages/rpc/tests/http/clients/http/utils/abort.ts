// ===========================================================
// Types
// ===========================================================

export type RequestCancellationContext = {
    readonly signal: AbortSignal;
    readonly timeoutMs: number;
    readonly didTimeout: boolean;
    readonly aborted: boolean;
    dispose: () => void;
};

// ===========================================================
// Functions
// ===========================================================

/**
 * Creates cancellation state for a request with a timeout.
 */
export function createRequestCancellationContext(
    timeoutMs: number,
    externalSignal?: AbortSignal,
): RequestCancellationContext {
    let didTimeout = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const abortFromExternalSignal = () => {
        controller.abort(externalSignal?.reason);
    };

    if (externalSignal?.aborted) {
        abortFromExternalSignal();
    } else {
        externalSignal?.addEventListener('abort', abortFromExternalSignal, {
            once: true,
        });
    }

    if (timeoutMs > 0) {
        timer = setTimeout(() => {
            didTimeout = true;
            controller.abort();
        }, timeoutMs);
    }

    return {
        get signal() {
            return controller.signal;
        },
        get timeoutMs() {
            return timeoutMs;
        },
        get didTimeout() {
            return didTimeout;
        },
        get aborted() {
            return controller.signal.aborted;
        },
        dispose() {
            if (timer !== undefined) {
                clearTimeout(timer);
            }
            externalSignal?.removeEventListener('abort', abortFromExternalSignal);
        },
    };
}
