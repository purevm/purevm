import { Client } from '../src/index.js';
import { debugTraceBlockByNumber, traceBlockByNumber } from '../src/api/_index.js';

// ===========================================================
// Constants
// ===========================================================

const PROVIDER_URL = "https://magical-broken-sanctuary.matic.quiknode.pro/45a9d37a142cc1266f601e4bf2117335f65b5883/";

// ===========================================================
// Client
// ===========================================================

const client = new Client({
    name: 'TEST',
    provider: {
        url: PROVIDER_URL,
        traceEnabled: true,
        debugEnabled: true,
    },
    debug: false,
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
    const blockNumber = 86525431;

    for (let i = blockNumber; i < blockNumber + 10; i++) {
        const hexValue = `0x${Number(i).toString(16)}`;
        console.log(`Block number: ${i}, Hex value: ${hexValue}`);

        const _debugTraces = await debugTraceBlockByNumber(client, hexValue as `0x${string}`);
        const _parityTraces = await traceBlockByNumber(client, hexValue as `0x${string}`);

        const debugEntries = Object.entries(_debugTraces);
        const parityEntries = Object.entries(_parityTraces);

        if (debugEntries.length !== parityEntries.length) {
            console.error(`Debug entries length ${debugEntries.length} does not match parity entries length ${parityEntries.length}.`);
        }

        for (const [txHash, debugTraces] of debugEntries) {
            const parityTraces = _parityTraces[txHash as `0x${string}`];

            if (!parityTraces) {
                throw new Error(`Hash ${txHash} NOT found in parity traces.`);
            }

            for (const debugTrace of debugTraces) {
                const isStaticCall = debugTrace.type === 'STATICCALL';
                const precompileName = getPrecompileName(debugTrace.to);

                if (isStaticCall && precompileName) {
                    console.log(txHash, 'STATICCALL + precompile:', precompileName);
                    continue; // Ignore static calls to precompiles
                }

                const debugString = normalizeTrace(debugTrace);

                let found = false;
                for (let i = 0; i < parityTraces.length; i++) {
                    const parityTrace = parityTraces[i]!;
                    const traceString = normalizeTrace(parityTrace);

                    if (debugString === traceString) {
                        found = true;
                        parityTraces.splice(i, 1);
                        break;
                    }
                }

                if (!found) {
                    throw new Error(`Debug trace ${debugString} NOT found in parity traces.`);
                }
            }

            if (parityTraces.length > 0) {
                throw new Error(`Parity traces ${parityTraces.length} NOT found in debug traces.`);
            }
        }
    }
})();