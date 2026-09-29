import type {
  BlockHash,
  RpcBlock,
  RpcLog,
  RpcTransaction,
  TraceCallEntry,
  TraceRewardEntry,
  TransactionHash,
} from "@purevm/rpc-public";
import { describe, expect, test } from "vitest";

import { assembleBlocks } from "../assemble-blocks.js";

const blockHash = (character: string) => `0x${character.repeat(64)}` as BlockHash;
const transactionHash = (character: string) => `0x${character.repeat(64)}` as TransactionHash;

function transaction(
  blockNumber: number,
  blockCharacter: string,
  index: number,
  transactionCharacter: string,
): RpcTransaction {
  return {
    blockHash: blockHash(blockCharacter),
    blockNumber: `0x${blockNumber.toString(16)}`,
    hash: transactionHash(transactionCharacter),
    transactionIndex: `0x${index.toString(16)}`,
  } as RpcTransaction;
}

function block(
  number: number,
  character: string,
  transactions: readonly RpcTransaction[],
): RpcBlock<true> {
  return {
    hash: blockHash(character),
    number: `0x${number.toString(16)}`,
    transactions,
  } as RpcBlock<true>;
}

function log(
  blockNumber: number,
  blockCharacter: string,
  transactionIndex: number,
  transactionCharacter: string,
  logIndex: number,
): RpcLog {
  return {
    blockHash: blockHash(blockCharacter),
    blockNumber: `0x${blockNumber.toString(16)}`,
    logIndex: `0x${logIndex.toString(16)}`,
    removed: false,
    transactionHash: transactionHash(transactionCharacter),
    transactionIndex: `0x${transactionIndex.toString(16)}`,
  } as RpcLog;
}

function trace(
  blockNumber: number,
  blockCharacter: string,
  transactionIndex: number,
  transactionCharacter: string,
  path: readonly number[],
  subtraces = 0,
  error?: string,
): TraceCallEntry {
  return {
    blockHash: blockHash(blockCharacter),
    blockNumber,
    ...(error === undefined ? {} : { error }),
    subtraces,
    traceAddress: path,
    transactionHash: transactionHash(transactionCharacter),
    transactionPosition: transactionIndex,
    type: "call",
  } as TraceCallEntry;
}

describe("assembleBlocks", () => {
  test("orders blocks, transactions, logs, and traces", () => {
    const firstTransactions = [transaction(10, "a", 0, "1"), transaction(10, "a", 1, "2")];
    const secondTransactions = [transaction(11, "b", 0, "3")];
    const result = assembleBlocks(
      [block(10, "a", firstTransactions), block(11, "b", secondTransactions)],
      [10n, 11n],
      [log(10, "a", 1, "2", 2), log(10, "a", 1, "2", 1)],
      [
        trace(10, "a", 1, "2", [0]),
        trace(11, "b", 0, "3", []),
        trace(10, "a", 0, "1", []),
        trace(10, "a", 1, "2", [], 1),
      ],
    );

    expect(result.blocks.map((entry) => entry.blockNumber)).toEqual([10n, 11n]);
    expect(result.blocks[0]?.transactions.map((entry) => entry.transactionIndex)).toEqual([0, 1]);
    expect(result.blocks[0]?.transactions[1]?.logs.map((entry) => entry.logIndex)).toEqual([
      "0x1",
      "0x2",
    ]);
    expect(result.blocks[0]?.transactions[1]?.traces.map((entry) => entry.traceAddress)).toEqual([
      [],
      [0],
    ]);
  });

  test("derives each transaction status from its top-level trace", () => {
    const result = assembleBlocks(
      [block(10, "a", [transaction(10, "a", 0, "1"), transaction(10, "a", 1, "2")])],
      [10n],
      [],
      [
        trace(10, "a", 0, "1", [], 1),
        trace(10, "a", 0, "1", [0], 0, "Out of gas"),
        trace(10, "a", 1, "2", [], 0, "Reverted"),
      ],
    );

    expect(result.blocks[0]?.transactions.map(({ error, status }) => ({ error, status }))).toEqual([
      { error: null, status: "success" },
      { error: "Reverted", status: "reverted" },
    ]);
  });

  test.each([
    {
      expected: "Missing trace 1 for transaction",
      name: "a declared child is missing",
      traces: [trace(10, "a", 0, "1", [], 2), trace(10, "a", 0, "1", [0])],
    },
    {
      expected: "Trace 0.0 has no parent",
      name: "a trace has no parent",
      traces: [trace(10, "a", 0, "1", []), trace(10, "a", 0, "1", [0, 0])],
    },
    {
      expected: "Missing root trace",
      name: "the root trace is missing",
      traces: [trace(10, "a", 0, "1", [0])],
    },
    {
      expected: "declares 0 subtraces but has 1",
      name: "a child was not declared",
      traces: [trace(10, "a", 0, "1", []), trace(10, "a", 0, "1", [0])],
    },
  ])("rejects an incomplete call tree when $name", ({ expected, traces }) => {
    const rpcBlock = block(10, "a", [transaction(10, "a", 0, "1")]);
    expect(() => assembleBlocks([rpcBlock], [10n], [], traces)).toThrow(expected);
  });

  test("rejects data from a different canonical block", () => {
    const rpcBlock = block(10, "a", [transaction(10, "a", 0, "1")]);
    expect(() =>
      assembleBlocks([rpcBlock], [10n], [log(10, "b", 0, "1", 0)], [trace(10, "a", 0, "1", [])]),
    ).toThrow("Log block hash mismatch for block 10");
  });

  test("rejects incomplete or incorrectly associated traces", () => {
    const rpcBlock = block(10, "a", [transaction(10, "a", 0, "1")]);
    expect(() => assembleBlocks([rpcBlock], [10n], [], [])).toThrow("has no trace");
    expect(() => assembleBlocks([rpcBlock], [10n], [], [trace(10, "a", 0, "2", [])])).toThrow(
      "Trace transaction hash mismatch",
    );
  });

  test("keeps reward traces at block level", () => {
    const rpcBlock = block(10, "a", [transaction(10, "a", 0, "1")]);
    const reward = {
      action: { author: "0x1", rewardType: "block", value: "0x1" },
      blockHash: blockHash("a"),
      blockNumber: 10,
      result: null,
      subtraces: 0,
      traceAddress: [],
      type: "reward",
    } as TraceRewardEntry;
    const result = assembleBlocks([rpcBlock], [10n], [], [trace(10, "a", 0, "1", []), reward]);

    expect(result.blocks[0]?.rewards).toEqual([reward]);
  });

  test.each([
    {
      expected: "Expected 0 blocks, received 1",
      mutate: (input: AssembleInput) => (input.expectedNumbers = []),
      name: "response count mismatch",
    },
    {
      expected: "Missing expected block number at index 0",
      mutate: (input: AssembleInput) =>
        (input.expectedNumbers = Array.from({ length: 1 }) as bigint[]),
      name: "missing expected number",
    },
    {
      expected: "Block 10 has no number",
      mutate: (input: AssembleInput) => (firstBlock(input).number = null),
      name: "missing block number",
    },
    {
      expected: "Requested block 10, received block 11",
      mutate: (input: AssembleInput) => (firstBlock(input).number = "0xb"),
      name: "wrong block number",
    },
    {
      expected: "is not a 32-byte hash",
      mutate: (input: AssembleInput) => (firstBlock(input).hash = "0x1"),
      name: "invalid block hash",
    },
    {
      expected: "has no index",
      mutate: (input: AssembleInput) => (firstTransaction(input).transactionIndex = null),
      name: "missing transaction index",
    },
    {
      expected: "transaction position 0 has RPC index 1",
      mutate: (input: AssembleInput) => (firstTransaction(input).transactionIndex = "0x1"),
      name: "wrong transaction index",
    },
    {
      expected: "has no block number",
      mutate: (input: AssembleInput) => (firstTransaction(input).blockNumber = null),
      name: "missing transaction block number",
    },
    {
      expected: "belongs to another block",
      mutate: (input: AssembleInput) => (firstTransaction(input).blockNumber = "0xb"),
      name: "wrong transaction block number",
    },
    {
      expected: "has a different block hash",
      mutate: (input: AssembleInput) => (firstTransaction(input).blockHash = blockHash("b")),
      name: "wrong transaction block hash",
    },
    {
      expected: "duplicate transaction hash",
      mutate: (input: AssembleInput) => {
        const target = firstBlock(input);
        target.transactions = [...target.transactions, transaction(10, "a", 1, "1")];
      },
      name: "duplicate transaction hash",
    },
    {
      expected: "Range log has no block number",
      mutate: (input: AssembleInput) => (firstLog(input).blockNumber = null),
      name: "missing log block number",
    },
    {
      expected: "Log belongs to unexpected block 11",
      mutate: (input: AssembleInput) => (firstLog(input).blockNumber = "0xb"),
      name: "log outside range",
    },
    {
      expected: "Removed log returned",
      mutate: (input: AssembleInput) => (firstLog(input).removed = true),
      name: "removed log",
    },
    {
      expected: "has no transaction index",
      mutate: (input: AssembleInput) => (firstLog(input).transactionIndex = null),
      name: "missing log transaction index",
    },
    {
      expected: "Log transaction index 1 is absent",
      mutate: (input: AssembleInput) => (firstLog(input).transactionIndex = "0x1"),
      name: "unknown log transaction",
    },
    {
      expected: "Log transaction hash mismatch",
      mutate: (input: AssembleInput) => (firstLog(input).transactionHash = transactionHash("2")),
      name: "wrong log transaction hash",
    },
    {
      expected: "has no index",
      mutate: (input: AssembleInput) => (firstLog(input).logIndex = null),
      name: "missing log index",
    },
    {
      expected: "Duplicate log index 0",
      mutate: (input: AssembleInput) => input.logs.push({ ...firstLog(input) }),
      name: "duplicate log index",
    },
    {
      expected: "Invalid trace block number -1",
      mutate: (input: AssembleInput) => (firstTrace(input).blockNumber = -1),
      name: "invalid trace block number",
    },
    {
      expected: "Trace belongs to unexpected block 11",
      mutate: (input: AssembleInput) => (firstTrace(input).blockNumber = 11),
      name: "trace outside range",
    },
    {
      expected: "Trace block hash mismatch",
      mutate: (input: AssembleInput) => (firstTrace(input).blockHash = blockHash("b")),
      name: "wrong trace block hash",
    },
    {
      expected: "Invalid trace transaction position -1",
      mutate: (input: AssembleInput) => (firstTrace(input).transactionPosition = -1),
      name: "invalid trace transaction position",
    },
    {
      expected: "Trace transaction index 1 is absent",
      mutate: (input: AssembleInput) => (firstTrace(input).transactionPosition = 1),
      name: "unknown trace transaction",
    },
    {
      expected: "Duplicate trace path root",
      mutate: (input: AssembleInput) => input.traces.push({ ...firstTrace(input) }),
      name: "duplicate trace path",
    },
  ])("rejects $name", ({ expected, mutate }) => {
    const input = createValidInput();
    mutate(input);
    expect(() =>
      assembleBlocks(input.blocks, input.expectedNumbers, input.logs, input.traces),
    ).toThrow(expected);
  });
});

type AssembleInput = {
  blocks: RpcBlock<true>[];
  expectedNumbers: bigint[];
  logs: RpcLog[];
  traces: TraceCallEntry[];
};

function createValidInput(): AssembleInput {
  return {
    blocks: [block(10, "a", [transaction(10, "a", 0, "1")])],
    expectedNumbers: [10n],
    logs: [log(10, "a", 0, "1", 0)],
    traces: [trace(10, "a", 0, "1", [])],
  };
}

function firstBlock(input: AssembleInput): RpcBlock<true> {
  const value = input.blocks[0];
  if (!value) throw new Error("Test fixture has no block");
  return value;
}

function firstTransaction(input: AssembleInput): RpcTransaction {
  const value = firstBlock(input).transactions[0];
  if (!value) throw new Error("Test fixture has no transaction");
  return value;
}

function firstLog(input: AssembleInput): RpcLog {
  const value = input.logs[0];
  if (!value) throw new Error("Test fixture has no log");
  return value;
}

function firstTrace(input: AssembleInput): TraceCallEntry {
  const value = input.traces[0];
  if (!value) throw new Error("Test fixture has no trace");
  return value;
}
