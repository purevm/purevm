import { NewHeads, type BlockHeader, type BlockData } from '../../modules/newHeads.js';
import { createBlockHandlers, type EventType } from './handlers/blockHandlers.js';

import { initBlock } from './init.js';
import { defaultStreamConfig } from './config.js';

// ===========================================================
// Types
// ===========================================================

export type StreamOptions = {
    chain: {
        name: string;
        blockTimeMs: number;
    };
    provider: {
        wsUrl: `ws://${string}` | `wss://${string}`;
        httpUrl: `https://${string}` | `http://${string}`;
    };
    onEvent: 
        (event: EventType, block: BlockData, header: BlockHeader) => void;
    onError: 
        (error: Error) => void;
    onLog: 
        (...args: any[]) => void;
};

// ===========================================================
// Class
// ===========================================================

export async function createStream(opts: StreamOptions, debug: boolean = false) {
    const { chain, provider, onEvent, onError, onLog } = opts;

    // ==========================
    // Initialize the block
    // ==========================

    const config = defaultStreamConfig(opts);
    const header = await initBlock(provider.httpUrl);
    const blockHandlers = createBlockHandlers({ header, onEvent, onLog, debug });

    // ==========================
    // Initialize the stream
    // ==========================

    const stream = new NewHeads({
        ...config,
        onHead: (block: BlockData, header: BlockHeader): void => {
            blockHandlers(block, header);
        },
        onError: (error: Error): void => {
            onError(error);
        },
        onLog: (message) => {
            onLog(`[block-streamer] ${message}`);
        },
    });

    // ==========================
    // Start the stream
    // ==========================

    stream.start();
    onLog(`[block-streamer] stream started for ${chain.name} at block ${header.number}`);

    // ==========================
    // Stop the stream
    // ==========================

    return (): void => {
        stream.stop();
        onLog(`[block-streamer] stream stopped for ${chain.name} at block ${header.number}`);
    };
}
