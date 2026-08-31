export type TimeoutContext = {
  readonly signal: AbortSignal;
  readonly timedOut: boolean;
  dispose(): void;
};

export function createTimeoutContext(timeoutMs: number, external?: AbortSignal): TimeoutContext {
  const controller = new AbortController();
  let timedOut = false;

  const abort = () => controller.abort(external?.reason);
  if (external?.aborted) abort();
  else external?.addEventListener("abort", abort, { once: true });

  const timer = setTimeout(() => {
    if (controller.signal.aborted) return;
    timedOut = true;
    controller.abort(new Error(`Timed out after ${timeoutMs}ms.`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    get timedOut() {
      return timedOut;
    },
    dispose() {
      clearTimeout(timer);
      external?.removeEventListener("abort", abort);
    },
  };
}
