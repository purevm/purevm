import type { StreamOptions } from './stream.js';

// ===========================================================
// Function
// ===========================================================

export function defaultStreamConfig(opts: StreamOptions) {
    return {
        // Provider options
        provider: {
            // URL for the WebSocket
            wsUrl: opts.provider.wsUrl,
            // URL for the HTTP
            httpUrl: opts.provider.httpUrl,
        },
        // Reconnect options
        reconnect: {
            // 2 seconds to wait before reconnecting after a disconnect
            delayMs: 2_000,         
        },
        // Heartbeat options
        heartbeat: {
            // Use the network version as ping
            method: "net_version",
            // 30 seconds of inactivity before ping is sent (chain block time is lower than 30s)
            idleTimeoutMs: 30_000,
            // 10 seconds to wait for a pong response after ping is sent
            pongTimeoutMs: 10_000,
        },
        // Polling options
        polling: {
            // Start polling after 2x the block time (this mean no block is received in the last 2x the block time)
            // and clamp to at least 5s
            delayBeforeStartMs: Math.max(5_000, opts.chain.blockTimeMs * 2),
            // Fetch a block every 1.25x the block time (to allow for some network latency)
            // and clamp to at least 2s (for chain with a block time lower than 2s)
            fetchIntervalMs: Math.max(2_000, opts.chain.blockTimeMs * 1.25),
        },
    } as const;
}
