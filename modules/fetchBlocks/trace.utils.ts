import type { TraceEntry } from "@purevm/rpc-public";

import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import type { FetchedTransaction } from "./types.js";

export function assertUniqueTracePaths(blockNumber: bigint, transaction: FetchedTransaction): void {
  const paths = new Set<string>();
  for (const trace of transaction.traces) {
    const path = trace.traceAddress.join(".");
    if (paths.has(path)) {
      throw new FetchBlocksDataError(
        `Duplicate trace path ${path || "root"} for transaction ${transaction.transactionHash} in block ${blockNumber}`,
      );
    }
    paths.add(path);
  }
}

export function compareTracePath(
  left: Pick<TraceEntry, "traceAddress">,
  right: Pick<TraceEntry, "traceAddress">,
): number {
  const length = Math.min(left.traceAddress.length, right.traceAddress.length);
  for (let index: number = 0; index < length; index++) {
    const leftPart = left.traceAddress[index] as number;
    const rightPart = right.traceAddress[index] as number;
    const difference = leftPart - rightPart;
    if (difference !== 0) return difference;
  }
  return left.traceAddress.length - right.traceAddress.length;
}

/**
 * Checks that the traces of one transaction form a complete call tree: a root, a parent for every
 * trace, and exactly `subtraces` children numbered from zero under each trace. A provider that
 * silently caps `trace_filter` results produces an incomplete tree.
 */
export function assertCompleteTraceTree(
  blockNumber: bigint,
  transaction: FetchedTransaction,
): void {
  const context = `transaction ${transaction.transactionHash} in block ${blockNumber}`;
  const byPath = new Map(transaction.traces.map((trace) => [trace.traceAddress.join("."), trace]));
  if (!byPath.has("")) throw new FetchBlocksDataError(`Missing root trace for ${context}`);

  const childCounts = new Map<string, number>();
  for (const trace of transaction.traces) {
    const path = trace.traceAddress;
    if (path.length === 0) continue;
    const parentPath = path.slice(0, -1).join(".");
    if (!byPath.has(parentPath)) {
      throw new FetchBlocksDataError(`Trace ${path.join(".")} has no parent for ${context}`);
    }
    childCounts.set(parentPath, (childCounts.get(parentPath) ?? 0) + 1);
  }

  for (const [path, trace] of byPath) {
    const children = childCounts.get(path) ?? 0;
    const prefix = path === "" ? "" : `${path}.`;
    for (let index = 0; index < trace.subtraces; index++) {
      if (!byPath.has(`${prefix}${index}`)) {
        throw new FetchBlocksDataError(
          `Missing trace ${prefix}${index} for ${context}; the provider may cap trace_filter results`,
        );
      }
    }
    if (children !== trace.subtraces) {
      throw new FetchBlocksDataError(
        `Trace ${path || "root"} declares ${trace.subtraces} subtraces but has ${children} for ${context}`,
      );
    }
  }
}
