import type { CallTracerConfig } from "./types.js";

/** Tracer used when a `debug_trace*` action receives no configuration. */
export const DEFAULT_TRACER: CallTracerConfig = { tracer: "callTracer" };
