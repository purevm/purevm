import type { HttpClient } from "../../../src/index.js";
import type { BlockNumber } from "../../../src/types.js";
import { bigintToHex } from "../../../src/utils.js";

// ===========================================================
// Types
// ===========================================================

export type FetchRange<T> = (
    client: HttpClient,
    fromBlock: BlockNumber,
    toBlock: BlockNumber,
) => Promise<T>;

type BlockRange = {
    fromBlock: bigint;
    toBlock: bigint;
};

type HexBlockRange = {
    fromBlock: BlockNumber;
    toBlock: BlockNumber;
};

// ===========================================================
// Function
// ===========================================================

export async function fetchBySplit<T>(
    callback: (range: HexBlockRange) => Promise<void>,
    options: BlockRange,
): Promise<void> {
    const ranges: BlockRange[] = [
        {
            fromBlock: options.fromBlock,
            toBlock: options.toBlock,
        },
    ];

    while (ranges.length > 0) {
        const range = ranges.shift()!;
        try {
            await callback({
                fromBlock: bigintToHex(range.fromBlock),
                toBlock: bigintToHex(range.toBlock),
            });
        }
        catch (error) {
            if (range.fromBlock === range.toBlock) {
                throw new Error(`Failed to fetch block ${range.fromBlock}`, { 
                    cause: error 
                });
            } else {
                console.error(error);
            }

            const middleBlock = (range.fromBlock + range.toBlock) / 2n;

            ranges.unshift(
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
