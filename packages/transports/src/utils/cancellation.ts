// ===========================================================
// Constants
// ===========================================================

/** Largest delay Node/browsers accept; above this a timer fires immediately. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

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

    const effectiveTimeoutMs =
        Number.isFinite(timeoutMs) && timeoutMs > 0
            ? Math.min(timeoutMs, MAX_TIMEOUT_MS)
            : 0;

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

    // An already-aborted request must not be re-labelled as a timeout, so the
    // timer is neither armed nor allowed to overwrite an existing abort.
    const timeoutId =
        effectiveTimeoutMs > 0 && !controller.signal.aborted
            ? setTimeout(() => {
                if (controller.signal.aborted) {
                    return;
                }
                didTimeout = true;
                controller.abort(
                    new DOMException(
                        `Request timed out after ${effectiveTimeoutMs}ms`,
                        'TimeoutError',
                    ),
                );
            }, effectiveTimeoutMs)
            : undefined

    return {
        signal: controller.signal,
        timeoutMs: effectiveTimeoutMs,
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
