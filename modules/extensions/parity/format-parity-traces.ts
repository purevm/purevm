import type { BlockHash, TraceEntry, TransactionHash } from "@purevm/rpc-public";

import { NULL_TRANSACTION_HASH } from "../constants.js";
import { ExtensionDataError } from "../errors/index.js";
import type { ParityBlockTracesResult, Trace, TracesByTransactionHash } from "../types.js";
import { normalizeHash } from "../utils/hash.js";
import { getEffectiveTraceError, getTracePathKey } from "../utils/trace-error.js";

type TransactionTraceData = {
  errors: Map<string, string>;
  traces: TraceEntry[];
};

export function formatParityTraces(
  response: readonly TraceEntry[],
  expectedBlockHash?: BlockHash,
): ParityBlockTracesResult {
  const blockHash = getBlockHash(response, expectedBlockHash);
  const grouped = groupByTransactionHash(response);
  const traces: TracesByTransactionHash = {};

  for (const [transactionHash, data] of grouped) {
    traces[transactionHash] = data.traces.map((trace) =>
      formatTrace(trace, getEffectiveTraceError(trace.traceAddress, data.errors)),
    );
  }

  return { blockHash, traces };
}

function getBlockHash(
  response: readonly TraceEntry[],
  expectedBlockHash?: BlockHash,
): BlockHash | null {
  const expected = expectedBlockHash
    ? normalizeHash(expectedBlockHash, "Expected block hash")
    : undefined;
  let blockHash: BlockHash | undefined = expected;

  for (const trace of response) {
    const current = normalizeHash(trace.blockHash, "Trace block hash");
    if (blockHash && current !== blockHash) {
      throw new ExtensionDataError(
        `Trace block hash mismatch: expected ${blockHash}, received ${current}`,
      );
    }
    blockHash = current;
  }

  return blockHash ?? null;
}

function groupByTransactionHash(
  response: readonly TraceEntry[],
): Map<TransactionHash, TransactionTraceData> {
  const grouped = new Map<TransactionHash, TransactionTraceData>();

  for (const trace of response) {
    const transactionHash = getTransactionHash(trace);
    const data: TransactionTraceData = grouped.get(transactionHash) ?? {
      errors: new Map(),
      traces: [],
    };
    data.traces.push(trace);
    if (trace.error) data.errors.set(getTracePathKey(trace.traceAddress), trace.error);
    grouped.set(transactionHash, data);
  }

  return grouped;
}

function getTransactionHash(trace: TraceEntry): TransactionHash {
  if (trace.type === "reward") return NULL_TRANSACTION_HASH;
  return normalizeHash(trace.transactionHash, "Trace transaction hash");
}

function formatTrace(trace: TraceEntry, error: string | null): Trace {
  switch (trace.type) {
    case "call":
      return {
        error,
        from: trace.action.from,
        input: trace.action.input,
        output: trace.result?.output ?? "0x",
        path: trace.traceAddress,
        to: trace.action.to,
        type: trace.action.callType.toUpperCase() as
          | "CALL"
          | "CALLCODE"
          | "DELEGATECALL"
          | "STATICCALL",
        value: trace.action.value,
      };
    case "create":
      return {
        error,
        from: trace.action.from,
        input: trace.action.init,
        output: trace.result?.code ?? "0x",
        path: trace.traceAddress,
        to: trace.result?.address ?? null,
        type: trace.action.creationMethod === "create2" ? "CREATE2" : "CREATE",
        value: trace.action.value,
      };
    case "suicide":
      return {
        error,
        from: trace.action.address,
        path: trace.traceAddress,
        to: trace.action.refundAddress,
        type: "SUICIDE",
        value: trace.action.balance,
      };
    case "reward":
      return {
        error,
        path: trace.traceAddress,
        rewardType: trace.action.rewardType,
        to: trace.action.author,
        type: "REWARD",
        value: trace.action.value,
      };
  }
}
