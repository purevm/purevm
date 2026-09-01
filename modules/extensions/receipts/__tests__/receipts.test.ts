import type {
  BlockHash,
  BlockNumber,
  HttpClient,
  HttpRequestOptions,
  RpcTransactionReceipt,
  TransactionHash,
} from "@purevm/rpc";
import { describe, expect, it, vi } from "vitest";

import { ExtensionDataError } from "../../errors/index.js";
import { getBlockReceiptsByHash } from "../getBlockReceiptsByHash.js";
import { getBlockReceiptsByNumber } from "../getBlockReceiptsByNumber.js";
import { getBlockReceiptsByTag } from "../getBlockReceiptsByTag.js";

const UPPER_HASH = `0x${"C".repeat(64)}` as TransactionHash;
const LOWER_HASH = UPPER_HASH.toLowerCase() as TransactionHash;
const BLOCK_HASH = `0x${"d".repeat(64)}` as BlockHash;
const BLOCK_NUMBER = "0x20" as BlockNumber;
const receipt = { transactionHash: UPPER_HASH } as RpcTransactionReceipt;
const options: HttpRequestOptions = { retry: { retries: 1 } };

describe("receipt extensions", () => {
  it("maps receipts by lowercase transaction hash", async () => {
    const ethGetBlockReceiptsByNumber = vi
      .fn<() => Promise<unknown>>()
      .mockResolvedValue([receipt]);
    const client = { ethGetBlockReceiptsByNumber } as unknown as HttpClient;

    const result = await getBlockReceiptsByNumber(client, BLOCK_NUMBER, options);

    expect(ethGetBlockReceiptsByNumber).toHaveBeenCalledWith(BLOCK_NUMBER, options);
    expect(result.receipts).toEqual({ [LOWER_HASH]: receipt });
  });

  it("delegates hash and tag selectors", async () => {
    const ethGetBlockReceiptsByHash = vi.fn<() => Promise<unknown>>().mockResolvedValue([]);
    const ethGetBlockReceiptsByTag = vi.fn<() => Promise<unknown>>().mockResolvedValue([]);
    const client = {
      ethGetBlockReceiptsByHash,
      ethGetBlockReceiptsByTag,
    } as unknown as HttpClient;

    await getBlockReceiptsByHash(client, BLOCK_HASH, options);
    await getBlockReceiptsByTag(client, "safe", options);

    expect(ethGetBlockReceiptsByHash).toHaveBeenCalledWith(BLOCK_HASH, options);
    expect(ethGetBlockReceiptsByTag).toHaveBeenCalledWith("safe", options);
  });

  it("rejects missing and duplicate receipts", async () => {
    const missingClient = {
      ethGetBlockReceiptsByTag: vi.fn<() => Promise<unknown>>().mockResolvedValue(null),
    } as unknown as HttpClient;
    const duplicateClient = {
      ethGetBlockReceiptsByNumber: vi
        .fn<() => Promise<unknown>>()
        .mockResolvedValue([receipt, { transactionHash: LOWER_HASH }]),
    } as unknown as HttpClient;

    await expect(getBlockReceiptsByTag(missingClient, "latest")).rejects.toThrow(
      ExtensionDataError,
    );
    await expect(getBlockReceiptsByNumber(duplicateClient, BLOCK_NUMBER)).rejects.toThrow(
      "duplicate transaction hash",
    );
  });
});
