import { client } from './_client.js';
import type { RpcLog, RpcTransactionReceipt } from '../src/api/types.js';
import 'dotenv/config';

// ===========================================================
// Main
// ===========================================================

(async () => {
    const fromBlock = 89128150;
    const toBlock = fromBlock + 10;

    for (let i = fromBlock; i < toBlock; i++) {
        const blockNumber = `0x${Number(i).toString(16)}` as `0x${string}`;

        const tracesByFilter = (await client.trace.traceFilter([{
            fromBlock: blockNumber,
            toBlock: blockNumber,
        }])).filter((trace) => trace.type !== 'reward');

        const tracesByBlockNumber = (await client.trace.traceBlockByNumber([
            blockNumber,
        ])).filter((trace) => trace.type !== 'reward');

        if (tracesByFilter.length !== tracesByBlockNumber.length) {
            console.log(`Trace length mismatch: ${tracesByFilter.length} !== ${tracesByBlockNumber.length}`);
        }

        const maxLength = Math.max(tracesByFilter.length, tracesByBlockNumber.length);

        for (let j = 0; j < maxLength; j++) {
            const traceByFilter = tracesByFilter[j];
            const traceByBlockNumber = tracesByBlockNumber[j];

            const filterStr = orderedStringify(traceByFilter);
            const blockNumberStr = orderedStringify(traceByBlockNumber);

            if (filterStr !== blockNumberStr) {
                console.log(`Trace mismatch at index ${j}`);
                console.log(`By filter:      ${filterStr}`);
                console.log(`By blockNumber: ${blockNumberStr}`);
            }
        }
    }
})();

function orderedStringify(obj: any): string {
    if (obj === null || typeof obj !== "object") {
        return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
        return `[${obj.map(orderedStringify).join(",")}]`;
    }

    const keys = Object.keys(obj)
        .filter(key => key !== "error")
        .sort();

    return `{${keys.map(key => (
        JSON.stringify(key) + ":" + orderedStringify(obj[key])
    )).join(",")}}`;
}