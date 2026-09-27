import type { EthGetBlockByNumberParameters, HttpRequestOptions, RpcBlock } from "@purevm/public";
import { describe, expect, test, vi } from "vitest";

import { fetchBlocksByNumber } from "../block.request.js";
import { fakeContext } from "./helpers.js";

type GetBlock = (
  parameters: EthGetBlockByNumberParameters<true>,
  options?: HttpRequestOptions,
) => Promise<RpcBlock<true> | null>;

describe("fetchBlocksByNumber", () => {
  test("preserves block order while bounding concurrent calls", async () => {
    let active = 0;
    let maxActive = 0;
    const ethGetBlockByNumber = vi.fn<GetBlock>(async ({ blockNumber }) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      return { number: blockNumber } as RpcBlock<true>;
    });

    const blocks = await fetchBlocksByNumber(fakeContext({ ethGetBlockByNumber }, {}, 2), [
      1n,
      2n,
      3n,
      4n,
    ]);

    expect(blocks.map((block) => block.number)).toEqual(["0x1", "0x2", "0x3", "0x4"]);
    expect(maxActive).toBe(2);
  });

  test("rejects a missing block", async () => {
    const ethGetBlockByNumber = vi.fn<GetBlock>().mockResolvedValue(null);

    await expect(fetchBlocksByNumber(fakeContext({ ethGetBlockByNumber }), [7n])).rejects.toThrow(
      "Block 7 was not found",
    );
  });
});
