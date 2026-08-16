import { HttpClient } from '../src/clients/index.js';
import { getBlocksTraces } from '../src/extensions/_index.js';
import 'dotenv/config';

// ===========================================================
// Client
// ===========================================================

const httpUrl = process.env['HTTP_URL'];

if (!httpUrl) {
    throw new Error('HTTP_URL is not set');
}

const client = new HttpClient({
    url: httpUrl as `http://${string}` | `https://${string}`,
    timeoutMs: 30_000,
});

// ===========================================================
// Helper Functions
// ===========================================================

// Ignore calls to EVM precompiles.
// Precompiles are built-in contracts at low addresses (e.g. 0x01 = ecrecover)
// used for cryptographic/hash operations. They do not represent user-level
// protocol activity, contract creation/destruction, logs, or meaningful native
// transfers for our indexer. Geth debug traces may expose them, while parity-style
// traces often omit them, so skipping them also keeps both trace sources aligned.
const EVM_PRECOMPILES = new Map<`0x${string}`, string>([
    ["0x0000000000000000000000000000000000000001", "ECRECOVER"],
    ["0x0000000000000000000000000000000000000002", "SHA256"],
    ["0x0000000000000000000000000000000000000003", "RIPEMD160"],
    ["0x0000000000000000000000000000000000000004", "IDENTITY"],
    ["0x0000000000000000000000000000000000000005", "MODEXP"],
    ["0x0000000000000000000000000000000000000006", "BN256_ADD"],
    ["0x0000000000000000000000000000000000000007", "BN256_MUL"],
    ["0x0000000000000000000000000000000000000008", "BN256_PAIRING"],
    ["0x0000000000000000000000000000000000000009", "BLAKE2F"],
    ["0x000000000000000000000000000000000000000a", "POINT_EVALUATION"],
]);

function getPrecompileName(address?: `0x${string}`): string | undefined {
    if (!address) {
        return undefined;
    }
    return EVM_PRECOMPILES.get(address.toLowerCase() as `0x${string}`);
}

function normalizeTrace(trace: any): string {
    return JSON.stringify(
        Object.keys(trace)
            .filter((key) => key !== 'path')
            .sort()
            .reduce((acc: Record<string, any>, key: string) => {
                if (key === 'error') {
                    acc[key] = trace[key as keyof typeof trace] !== undefined;
                } else {
                    acc[key] = trace[key as keyof typeof trace];
                }
                return acc;
            }, {} as typeof trace)
    );
}

// ===========================================================
// Main
// ===========================================================

(async () => {
    const fromBlock = 89128150;
    const toBlock = 89128155;

    const fromBlockHex = `0x${Number(fromBlock).toString(16)}` as `0x${string}`;
    const toBlockHex = `0x${Number(toBlock).toString(16)}` as `0x${string}`;
    
    const blocksTraces = await getBlocksTraces(client, fromBlockHex, toBlockHex);

    for (let i = fromBlock; i < toBlock; i++) {
        const hexValue = `0x${Number(i).toString(16)}`;
        console.log(`Block number: ${i}, Hex value: ${hexValue}`);

        const _blockTraces = blocksTraces[i];
        const _parityTraces = await client.traceBlockByNumber(hexValue as `0x${string}`);

        if (!_blockTraces) {
            throw new Error(`Block traces not found for block ${i}.`);
        }

        const blockEntries = Object.entries(_blockTraces);
        const parityEntries = Object.entries(_parityTraces.tracesByTxHash);

        if (blockEntries.length !== parityEntries.length) {
            console.error(`Block entries length ${blockEntries.length} does not match parity entries length ${parityEntries.length}.`);
        }

        for (const [txHash, transactionTraces] of blockEntries) {
            const parityTransactionTraces = _parityTraces.tracesByTxHash[txHash as `0x${string}`];

            if (!parityTransactionTraces) {
                if (txHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    throw new Error(`Hash ${txHash} NOT found in parity traces.`);
                }
                continue;
            }

            for (const txTrace of transactionTraces) {
                const isStaticCall = txTrace.type === 'STATICCALL';
                const precompileName = getPrecompileName(txTrace.to);

                if (isStaticCall && precompileName) {
                    console.log(txHash, 'STATICCALL + precompile:', precompileName);
                    continue; // Ignore static calls to precompiles
                }

                const txTraceString = normalizeTrace(txTrace);

                let found = false;
                for (let i = 0; i < parityTransactionTraces.length; i++) {
                    const parityTrace = parityTransactionTraces[i]!;
                    const traceString = normalizeTrace(parityTrace);

                    if (txTraceString === traceString) {
                        found = true;
                        parityTransactionTraces.splice(i, 1);
                        break;
                    }
                }

                if (!found) {
                    throw new Error(`Debug trace ${txTraceString} NOT found in parity traces.`);
                }
            }

            if (parityTransactionTraces.length > 0) {
                throw new Error(`Parity traces ${parityTransactionTraces.length} NOT found in debug traces.`);
            }
        }
    }
})();