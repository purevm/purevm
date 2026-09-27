import type { RpcBlock, TransactionHash } from "@purevm/public";

import type { BlockBuilder } from "./block-builder.types.js";
import { FetchBlocksDataError } from "./FetchBlocksDataError.js";
import { normalizeBlockHash, normalizeTransactionHash, sameHash } from "./hash.utils.js";
import { parseQuantity, toSafeIndex } from "./range.utils.js";
import type { FetchedTransaction } from "./types.js";

export function createBlockBuilder(response: RpcBlock<true>, expectedNumber: bigint): BlockBuilder {
  if (!response.number) throw new FetchBlocksDataError(`Block ${expectedNumber} has no number`);
  const blockNumber = parseQuantity(response.number, `Block ${expectedNumber} number`);
  if (blockNumber !== expectedNumber) {
    throw new FetchBlocksDataError(
      `Requested block ${expectedNumber}, received block ${blockNumber}`,
    );
  }

  const blockHash = normalizeBlockHash(response.hash, `Block ${blockNumber} hash`);
  const transactionByIndex = new Map<number, FetchedTransaction>();
  const transactionHashes = new Set<TransactionHash>();
  const transactions = response.transactions.map((transaction, position) => {
    if (!transaction.transactionIndex) {
      throw new FetchBlocksDataError(`Transaction ${transaction.hash} has no index`);
    }
    const transactionIndex = toSafeIndex(
      transaction.transactionIndex,
      `Transaction ${transaction.hash} index`,
    );
    if (transactionIndex !== position) {
      throw new FetchBlocksDataError(
        `Block ${blockNumber} transaction position ${position} has RPC index ${transactionIndex}`,
      );
    }
    assertTransactionBlock(transaction, blockNumber, blockHash);

    const transactionHash = normalizeTransactionHash(
      transaction.hash,
      `Block ${blockNumber} transaction hash`,
    );
    if (transactionHashes.has(transactionHash)) {
      throw new FetchBlocksDataError(
        `Block ${blockNumber} has duplicate transaction hash ${transactionHash}`,
      );
    }
    transactionHashes.add(transactionHash);

    const fetched: FetchedTransaction = {
      // Set from the top-level trace by finalizeBlock.
      error: null,
      logs: [],
      traces: [],
      transaction,
      transactionHash,
      transactionIndex,
      status: "success",
    };
    transactionByIndex.set(transactionIndex, fetched);
    return fetched;
  });

  const { transactions: _transactions, ...block } = response;
  return {
    block,
    blockHash,
    blockNumber,
    logIndexes: new Set(),
    rewards: [],
    transactionByIndex,
    transactions,
  };
}

function assertTransactionBlock(
  transaction: RpcBlock<true>["transactions"][number],
  blockNumber: bigint,
  blockHash: string,
): void {
  if (!transaction.blockNumber) {
    throw new FetchBlocksDataError(`Transaction ${transaction.hash} has no block number`);
  }
  if (
    parseQuantity(transaction.blockNumber, `Transaction ${transaction.hash} block number`) !==
    blockNumber
  ) {
    throw new FetchBlocksDataError(`Transaction ${transaction.hash} belongs to another block`);
  }
  if (!sameHash(transaction.blockHash, blockHash)) {
    throw new FetchBlocksDataError(`Transaction ${transaction.hash} has a different block hash`);
  }
}
