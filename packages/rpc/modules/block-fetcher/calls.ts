import type { HttpClient } from "../../src/index.js";
import type { BlockNumber } from "../../src/types.js";
import { bigintToHex } from "../../src/utils.js";

// ===========================================================
// Types
// ===========================================================

export type FetchRange<T> = (
    client: HttpClient,
    fromBlock: BlockNumber,
    toBlock: BlockNumber,
) => Promise<T>;

export type FetchBySplitOptions = {
    /** Initial range size. */
    batchSize: bigint;
};

type BlockRange = {
    fromBlock: bigint;
    toBlock: bigint;
};

// ===========================================================
// Function
// ===========================================================

export async function fetchBySplit<T>(
    fromBlock: bigint,
    toBlock: bigint,
    callback: (range: { fromBlock: BlockNumber, toBlock: BlockNumber }) => Promise<void>,
    options: FetchBySplitOptions,
): Promise<void> {
    const queue = getBlockRanges(
        fromBlock,
        toBlock,
        options.batchSize,
    );

    while (queue.length > 0) {
        const range = queue.shift()!;
        try {
            await callback({
                fromBlock: bigintToHex(range.fromBlock),
                toBlock: bigintToHex(range.toBlock),
            });
        }
        catch (error) {
            if (range.fromBlock === range.toBlock) {
                throw new Error(
                    `Failed to fetch block ${range.fromBlock}`,
                    { cause: error },
                );
            }

            const middleBlock = (range.fromBlock + range.toBlock) / 2n;

            queue.unshift(
                {
                    fromBlock: middleBlock + 1n,
                    toBlock: range.toBlock,
                },
                {
                    fromBlock: range.fromBlock,
                    toBlock: middleBlock,
                },
            );
        }
    }
}

function getBlockRanges(
    fromBlock: bigint,
    toBlock: bigint,
    batchSize: bigint,
): BlockRange[] {
    if (batchSize <= 0n) {
        throw new Error("Batch size must be greater than 0.");
    }

    if (fromBlock > toBlock) {
        throw new Error("fromBlock must be lower than or equal to toBlock.");
    }

    const ranges: BlockRange[] = [];

    for (let start = fromBlock; start <= toBlock; start += batchSize) {
        const end = start + batchSize - 1n;

        ranges.push({
            fromBlock: start,
            toBlock: end > toBlock ? toBlock : end,
        });
    }

    return ranges;
}
