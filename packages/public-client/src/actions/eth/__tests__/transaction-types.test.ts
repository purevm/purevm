import { expect, expectTypeOf, test } from "vitest";

import { createHttpClient } from "../../../clients/http-client.js";
import type {
  RpcTransaction,
  RpcTransactionEip1559,
  RpcTransactionOpDeposit,
  RpcTransactionUnknown,
} from "../types.js";

const hash = `0x${"1".repeat(64)}` as const;
const address = `0x${"2".repeat(40)}` as const;

const base = {
  blockHash: hash,
  blockNumber: "0x10",
  from: address,
  gas: "0x5208",
  hash,
  input: "0x",
  nonce: "0x0",
  to: address,
  transactionIndex: "0x0",
  value: "0x0",
};
const opDeposit = {
  ...base,
  depositReceiptVersion: "0x1",
  isSystemTx: false,
  mint: "0xde0b6b3a7640000",
  sourceHash: hash,
  type: "0x7e",
};
const arbitrumInternal = { ...base, l1BaseFee: "0x3b9aca00", type: "0x6a" };

test("returns chain-specific transactions with every field intact", async () => {
  const client = createHttpClient({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as { id: number };
      return Response.json({
        id: request.id,
        jsonrpc: "2.0",
        result: { hash, number: "0x10", transactions: [opDeposit, arbitrumInternal] },
      });
    },
  });

  const block = await client.ethGetBlockByNumber({
    blockNumber: "0x10",
    includeTransactions: true,
  });

  expect(block?.transactions).toEqual([opDeposit, arbitrumInternal]);
});

test("narrows known transaction types exactly", () => {
  const transaction = {} as RpcTransaction;

  if (transaction.type === "0x2") {
    expectTypeOf(transaction).toEqualTypeOf<RpcTransactionEip1559>();
  }
  if (transaction.type === "0x7e") {
    expectTypeOf(transaction).toEqualTypeOf<RpcTransactionOpDeposit>();
    expectTypeOf(transaction.sourceHash).toEqualTypeOf<`0x${string}`>();
  }
  if (
    transaction.type !== "0x0" &&
    transaction.type !== "0x1" &&
    transaction.type !== "0x2" &&
    transaction.type !== "0x3" &&
    transaction.type !== "0x4" &&
    transaction.type !== "0x7e"
  ) {
    expectTypeOf(transaction).toEqualTypeOf<RpcTransactionUnknown>();
    expectTypeOf(transaction["l1BaseFee"]).toBeUnknown();
    expectTypeOf(String(transaction.type) === "0x6a").toBeBoolean();
  }
});
