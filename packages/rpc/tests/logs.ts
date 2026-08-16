import { client } from './_client.js';
import type { RpcLog, RpcTransactionReceipt } from '../src/api/types.js';
import 'dotenv/config';

// ===========================================================
// Main
// ===========================================================

(async () => {
    const fromBlock = 89128150;
    const toBlock = 89128155;

    const fromBlockHex = `0x${Number(fromBlock).toString(16)}` as `0x${string}`;
    const toBlockHex = `0x${Number(toBlock).toString(16)}` as `0x${string}`;

    const blocksLogsByNumber = await getLogsByRange(fromBlockHex, toBlockHex);

    for (let i = fromBlock; i < toBlock; i++) {
        const hexValue = `0x${Number(i).toString(16)}`;
        console.log(`Block number: ${i}, Hex value: ${hexValue}`);

        const blockLogs = blocksLogsByNumber.get(hexValue as `0x${string}`);
        const blockReceipts = await getBlockReceiptsByNumber(hexValue as `0x${string}`);

        for (const receipt of blockReceipts.values()) {
            const transactionLogs = blockLogs?.[receipt.transactionHash];

            if (receipt.status !== '0x1' && receipt.logs.length > 1) {
                console.log(`Transaction ${receipt.transactionHash} failed`);
            }
            
            let foundAllLogs = true;
            for (const receiptLog of receipt.logs) {
                const transactionLog = transactionLogs?.find(log => log.logIndex === receiptLog.logIndex);
                if (orderedStringify(receiptLog) !== orderedStringify(transactionLog)) {
                    foundAllLogs = false;
                    console.log(`Log ${receiptLog.logIndex} not found in transaction logs`);
                    break;
                }
            }
            if (foundAllLogs = false) {
                console.log(`Some logs not found in transaction logs`);
            }
        }
    }
})();


// ===========================================================
// Main
// ===========================================================

async function getLogsByRange(fromBlock: `0x${string}`, toBlock: `0x${string}`) {
    const blocksLogs = await client.getLogsByRange({ fromBlock, toBlock });

    let blocksLogsByNumber = new Map<`0x${string}`, { [transactionHash: `0x${string}`]: RpcLog[] }>();

    for (const log of blocksLogs ?? []) {
        const blockNumber = log.blockNumber as `0x${string}`;
        const transactionHash = log.transactionHash.toLowerCase() as `0x${string}`;

        let blockLogs = blocksLogsByNumber.get(blockNumber);
        if (!blockLogs) {
            blockLogs = {};
        }

        let transactionLogs = blockLogs[transactionHash];
        if (!transactionLogs) {
            transactionLogs = [];
        }

        transactionLogs.push(log);
        blockLogs[log.transactionHash] = transactionLogs;
        blocksLogsByNumber.set(blockNumber, blockLogs);
    }

    return blocksLogsByNumber;
}

async function getBlockReceiptsByNumber(blockNumber: `0x${string}`) {
    const blockReceipts = await client.getBlockReceiptsByNumber(blockNumber);

    let transactionReceipts = new Map<`0x${string}`, RpcTransactionReceipt>();

    for (const receipt of blockReceipts ?? []) {
        const transactionHash = receipt.transactionHash.toLowerCase() as `0x${string}`;
        transactionReceipts.set(transactionHash, receipt);
    }

    return transactionReceipts;
}

function orderedStringify(obj: any): string {
    if (Array.isArray(obj)) {
        return `[${obj.map(orderedStringify).join(",")}]`;
    } else if (obj && typeof obj === "object") {
        return `{${Object.keys(obj).sort().map(key => `"${key}":${orderedStringify(obj[key])}`).join(",")}}`;
    } else {
        return JSON.stringify(obj);
    }
}