import type { BlockNumber } from "../../../src/types.js";
import { bigintToHex } from "../../../src/utils.js";

// ===========================================================
// Types
// ===========================================================

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

export async function fetchBySplit(
    callback: (range: HexBlockRange) => Promise<void>,
    options: BlockRange,
): Promise<void> {
    if (options.fromBlock > options.toBlock) {
        throw new Error('fromBlock must be lower than or equal to toBlock');
    }

    const ranges: BlockRange[] = [
        {
            fromBlock: options.fromBlock,
            toBlock: options.toBlock,
        },
    ];
    const retries = new Map<string, number>();

    while (ranges.length > 0) {
        const range = ranges.shift()!;
        try {
            await callback({
                fromBlock: bigintToHex(range.fromBlock),
                toBlock: bigintToHex(range.toBlock),
            });
        }
        catch (error) {
            const key = `${range.fromBlock}:${range.toBlock}`;
            const retryCount = retries.get(key) ?? 0;

            if (retryCount === 0) {
                retries.set(key, 1);
                ranges.push(range);
                continue;
            }

            if (range.fromBlock === range.toBlock) {
                throw new Error(`Failed to fetch block ${range.fromBlock}`, { 
                    cause: error 
                });
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
