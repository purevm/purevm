// ============================================================================
// TRACER CONFIG
// ============================================================================

/**
 * The configuration for the "callTracer".
 */
export type CallTracerConfig = {
  /** The tracer type */
  tracer: "callTracer";
  /** The tracer configuration */
  tracerConfig?: {
    /** Only trace the primary (top-level) call and not any sub-calls */
    onlyTopCall?: boolean;
  };
};
