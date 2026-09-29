import type { DebugBlockTrace, DebugCallFrame } from "@purevm/rpc-public";

import { ExtensionDataError } from "../errors/index.js";
import type { Trace, TracesResult } from "../types.js";
import { normalizeHash } from "../utils/hash.js";

export function formatDebugTraces(response: readonly DebugBlockTrace[]): TracesResult {
  const traces: TracesResult["traces"] = {};

  for (const transaction of response) {
    const transactionHash = normalizeHash(transaction.txHash, "Debug trace transaction hash");
    if (Object.hasOwn(traces, transactionHash)) {
      throw new ExtensionDataError(
        `Debug traces contain duplicate transaction hash ${transactionHash}`,
      );
    }
    if (transaction.result === undefined) {
      throw new ExtensionDataError(
        `Debug tracer failed for transaction ${transactionHash}: ${transaction.error}`,
      );
    }
    traces[transactionHash] = flattenFrame(transaction.result, [], null);
  }

  return { traces };
}

function flattenFrame(frame: DebugCallFrame, path: number[], parentError: string | null): Trace[] {
  const error = frame.error || parentError;
  const trace = formatFrame(frame, path, error);
  const traces = [trace];

  for (const [index, child] of (frame.calls ?? []).entries()) {
    traces.push(...flattenFrame(child, [...path, index], error));
  }

  return traces;
}

function formatFrame(frame: DebugCallFrame, path: number[], error: string | null): Trace {
  const value = frame.value ?? "0x0";

  switch (frame.type) {
    case "CALL":
    case "CALLCODE":
    case "DELEGATECALL":
    case "STATICCALL":
      return {
        error,
        from: frame.from,
        input: frame.input,
        output: frame.output ?? "0x",
        path,
        to: frame.to ?? null,
        type: frame.type,
        value,
      };
    case "CREATE":
    case "CREATE2":
      return {
        error,
        from: frame.from,
        input: frame.input,
        output: frame.output ?? "0x",
        path,
        to: frame.to ?? null,
        type: frame.type,
        value,
      };
    case "SELFDESTRUCT":
    case "SUICIDE":
      return {
        error,
        from: frame.from,
        path,
        to: frame.to ?? null,
        type: frame.type,
        value,
      };
  }
}
