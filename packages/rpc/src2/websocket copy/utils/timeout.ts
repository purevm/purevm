// ===========================================================
// Types
// ===========================================================

export type TimeoutMs = number;

// ===========================================================
// Constants
// ===========================================================

const MIN_TIMEOUT_MS = 1;
const MAX_TIMEOUT_MS = 120_000;

// ===========================================================
// Functions
// ===========================================================

export function getTimeout(timeoutMs: number): TimeoutMs {
    if (
        !Number.isSafeInteger(timeoutMs) ||
        timeoutMs < MIN_TIMEOUT_MS ||
        timeoutMs > MAX_TIMEOUT_MS
    ) {
        throw new Error(
            `Please provide a timeout between ${MIN_TIMEOUT_MS}ms and ${MAX_TIMEOUT_MS}ms`,
        );
    }
    return timeoutMs;
}

/* 
export function createTimeout(timeoutMs: number): TimeoutMs {
    let timer: ReturnType<typeof setTimeout> | undefined

    const clear = () => {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
    }

    timer = setTimeout(() => {
        if (this.instance?.socket !== socket) return
        this.rejectConnect = undefined
        const error = new WebSocketConnectionError(
          `WebSocket connection timed out after ${timeout}ms.`,
        )
        void this.disconnect().then(
          () => reject(error),
          (disconnectError) =>
            reject(
              new WebSocketConnectionError(error.message, {
                cause: disconnectError,
              }),
            ),
        )
      }, timeout)

    return {
        clear,
    }
}
 */