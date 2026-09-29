import type {
  BlockHash,
  BlockNumber,
  BlockTag,
  HttpClient,
  HttpRequestOptions,
  RpcBlock,
  RpcTransaction,
  TransactionHash,
} from "@purevm/rpc-public";
import { describe, expect, it, vi } from "vitest";

import { ExtensionDataError } from "../../errors/index.js";
import { getBlockByHash } from "../getBlockByHash.js";
import { getBlockByNumber } from "../getBlockByNumber.js";
import { getBlockByTag } from "../getBlockByTag.js";

const UPPER_HASH = `0x${"A".repeat(64)}` as TransactionHash;
const LOWER_HASH = UPPER_HASH.toLowerCase() as TransactionHash;
const BLOCK_HASH = `0x${"b".repeat(64)}` as BlockHash;
const BLOCK_NUMBER = "0x10" as BlockNumber;
const BLOCK_TAG: BlockTag = "latest";
const transaction = { hash: UPPER_HASH } as RpcTransaction;
const block = {
  difficulty: "0x0",
  transactions: [transaction],
} as unknown as RpcBlock<true>;
const options: HttpRequestOptions = { timeoutMs: 123 };

describe("block extensions", () => {
  it("splits block metadata and maps transactions by lowercase hash", async () => {
    const ethGetBlockByNumber = vi.fn<() => Promise<unknown>>().mockResolvedValue(block);
    const client = { ethGetBlockByNumber } as unknown as HttpClient;

    const result = await getBlockByNumber(client, BLOCK_NUMBER, options);

    expect(ethGetBlockByNumber).toHaveBeenCalledWith(
      { blockNumber: BLOCK_NUMBER, includeTransactions: true },
      options,
    );
    expect(result.block).toEqual({ difficulty: "0x0" });
    expect(result.transactions).toEqual({ [LOWER_HASH]: transaction });
  });

  it("delegates hash and tag selectors", async () => {
    const ethGetBlockByHash = vi.fn<() => Promise<unknown>>().mockResolvedValue(block);
    const ethGetBlockByTag = vi.fn<() => Promise<unknown>>().mockResolvedValue(block);
    const client = { ethGetBlockByHash, ethGetBlockByTag } as unknown as HttpClient;

    await getBlockByHash(client, BLOCK_HASH, options);
    await getBlockByTag(client, BLOCK_TAG, options);

    expect(ethGetBlockByHash).toHaveBeenCalledWith(
      { blockHash: BLOCK_HASH, includeTransactions: true },
      options,
    );
    expect(ethGetBlockByTag).toHaveBeenCalledWith(
      { blockTag: BLOCK_TAG, includeTransactions: true },
      options,
    );
  });

  it("rejects missing blocks", async () => {
    const client = {
      ethGetBlockByHash: vi.fn<() => Promise<unknown>>().mockResolvedValue(null),
    } as unknown as HttpClient;

    await expect(getBlockByHash(client, BLOCK_HASH)).rejects.toThrow(ExtensionDataError);
  });

  it("rejects invalid and duplicate transaction hashes", async () => {
    const invalidBlock = {
      transactions: [{ hash: "0x1234" }],
    } as unknown as RpcBlock<true>;
    const duplicateBlock = {
      transactions: [transaction, { hash: LOWER_HASH }],
    } as unknown as RpcBlock<true>;
    const invalidClient = {
      ethGetBlockByNumber: vi.fn<() => Promise<unknown>>().mockResolvedValue(invalidBlock),
    } as unknown as HttpClient;
    const duplicateClient = {
      ethGetBlockByNumber: vi.fn<() => Promise<unknown>>().mockResolvedValue(duplicateBlock),
    } as unknown as HttpClient;

    await expect(getBlockByNumber(invalidClient, BLOCK_NUMBER)).rejects.toThrow(
      "must be a 32-byte hexadecimal hash",
    );
    await expect(getBlockByNumber(duplicateClient, BLOCK_NUMBER)).rejects.toThrow(
      "duplicate transaction hash",
    );
  });
});
