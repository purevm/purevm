import { NewHeadsStreaming, type NewHeadsStreamingOptions } from "./NewHeadsStreaming.js";
import { NewHeadsPolling, type NewHeadsPollingOptions } from "./NewHeadsPolling.js";
import type { BlockData, HeadSource } from "./types.js";
import { extractHeaderFromBlock, type BlockHeader } from "./utils/extractHeaderFromBlock.js";

// ===========================================================
// Types
// ===========================================================

export type NewHeadsOptions = {
    /** Provider options */
    provider: {
        /** URL for the WebSocket */
        wsUrl: NewHeadsStreamingOptions["url"];
        /** URL for the HTTP */
        httpUrl: NewHeadsPollingOptions["url"];
    };
    /** Reconnect options */
    reconnect: NewHeadsStreamingOptions["reconnect"];
    /** Heartbeat options */
    /** Legacy liveness options. Only idleTimeoutMs is used by newHeads. */
    heartbeat: {
        method?: "net_version" | "eth_blockNumber";
        idleTimeoutMs: number;
        pongTimeoutMs?: number;
    };
    /** Polling options */
    polling: {
        /** Delay before polling starts in ms */
        delayBeforeStartMs: number;
        /** Polling interval in ms */
        fetchIntervalMs: number;
    }
    /** Callback for the head */
    onHead: (block: BlockData, header: BlockHeader) => void;
    /** Callback for the error */
    onError: (err: Error) => void;
    /** Callback for the log */
    onLog?: (message: string) => void;
};

// ===========================================================
// Class
// ===========================================================

export class NewHeads {
    /** The streaming module */
    private readonly streaming: NewHeadsStreaming;
    /** The polling module */
    private readonly polling: NewHeadsPolling;
    /** The staleness timer */
    private stalenessTimer: NodeJS.Timeout | null = null;
    /** Last delivered block hash across both sources */
    private lastDeliveredHash: `0x${string}` | null = null;
    /** Whether the stream is running */
    private running = false;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly opts: NewHeadsOptions
    ) {
        // Create the streaming module
        this.streaming = new NewHeadsStreaming({
            url: opts.provider.wsUrl,
            reconnect: opts.reconnect,
            idleTimeoutMs: opts.heartbeat.idleTimeoutMs,
            onHead: (header) => this.handleHead(header, "ws"),
            onError: (err) => opts.onError(err),
            onLog: (message) => opts.onLog?.(`[streaming] ${message}`),
        });

        // Create the polling module
        this.polling = new NewHeadsPolling({
            url: opts.provider.httpUrl,
            fetchIntervalMs: opts.polling.fetchIntervalMs,
            onBlock: (block) => this.handleHead(block, "poll"),
            onError: (err) => opts.onError(err),
            onLog: (message) => opts.onLog?.(`[polling] ${message}`),
        });
    }

    // ==========================
    // Public API
    // ==========================

    start(): void {
        if (this.running) {
            return; // already running
        }
        this.running = true;
        this.lastDeliveredHash = null;

        this.resetStalenessTimer();
        this.streaming.start();
        this.opts.onLog?.("New heads started");
    }
    
    stop(): void {
        if (!this.running) {
            return; // not running
        }
        this.running = false;
        this.lastDeliveredHash = null;

        this.clearStalenessTimer();
        this.polling.stop();
        this.streaming.stop();
        this.opts.onLog?.("New heads stopped");
    }

    // ==========================
    // Head received
    // ==========================

    private handleHead(block: BlockData, source: HeadSource): void {
        let header: BlockHeader;

        try {
            header = extractHeaderFromBlock(block);
        } catch (err) {
            this.opts.onError(err instanceof Error ? err : new Error(String(err)));
            return;
        }

        this.resetStalenessTimer();
        if (source === "ws" && this.polling.isRunning) {
            this.polling.stop(); // stop polling only after a valid WS head was accepted
        }

        if (header.hash === this.lastDeliveredHash) {
            return; // duplicate head
        }
        this.lastDeliveredHash = header.hash;

        try {
            this.opts.onHead(block, header);
        } catch (err) {
            this.opts.onError(err instanceof Error ? err : new Error(String(err)));
            return;
        }
    }

    // ==========================
    // Staleness detection
    // ==========================

    private resetStalenessTimer(): void {
        this.clearStalenessTimer();

        if (this.running) {
            // If no head is received within the delay, start polling
            this.stalenessTimer = setTimeout(() => {
                this.polling.start();
            }, this.opts.polling.delayBeforeStartMs);
        }
    }

    private clearStalenessTimer(): void {
        if (this.stalenessTimer) {
            clearTimeout(this.stalenessTimer);
            this.stalenessTimer = null;
        }
    }
}
