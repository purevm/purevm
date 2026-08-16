import { ethGetBlockByNumber, type RpcBlock } from "./api/eth_getBlockByNumber.js";
import { normalizeError } from "../../utils/error.utils.js";    

// ===========================================================
// Types
// ===========================================================

export type NewHeadsPollingOptions = {
    /** URL for the HTTP */
    url: `https://${string}` | `http://${string}`;
    /** Fetch interval in ms */
    fetchIntervalMs: number;
    /** Callback for the head */
    onBlock: (block: RpcBlock) => void;
    /** Callback for error during the fetch */
    onError: (err: Error) => void;
    /** Callback for the log */
    onLog?: (message: string) => void;
};

// ===========================================================
// Class
// ===========================================================

export class NewHeadsPolling {
    /** Whether the polling is active */
    private _running = false;
    /** The timer for the polling interval */
    private _timeout: NodeJS.Timeout | null = null;
    /** The last block hash */
    private _lastBlockHash: string | null = null;

    // ==========================
    // Constructor
    // ==========================

    constructor(
        private readonly opts: NewHeadsPollingOptions
    ) {
        if (
            !opts.url ||
            (!opts.url.startsWith("http://") && !opts.url.startsWith("https://"))
        ) {
            throw new Error("A valid HTTP URL is required");
        }
        if (opts.fetchIntervalMs <= 0) {
            throw new Error("Fetch interval must be greater than 0");
        }
    }

    // ==========================
    // Public getters
    // ==========================

    /** Whether the polling is running */
    get isRunning(): boolean {
        return this._running;
    }

    // ==========================
    // Public API
    // ==========================

    start(): void {
        if (this._running) {
            return; // already active
        }
        this._running = true;

        this._poll();
        this.opts.onLog?.("Polling started");
    }

    stop(): void {
        if (!this._running) {
            return; // not active
        }
        this._running = false;

        this._clearTimeout();
        this.opts.onLog?.("Polling stopped");
    }

    // ==========================
    // Internal
    // ==========================

    private _poll(): void {
        if (!this._running) {
            return; // not active
        }

        void this._fetchLatestBlock().finally(() => {
            if (this._running) {
                this._timeout = setTimeout(() => {
                    this._poll();
                }, this.opts.fetchIntervalMs);
            }
        });
    }

    private _clearTimeout(): void {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }

    private async _fetchLatestBlock(): Promise<void> {
        try {
            const block = await ethGetBlockByNumber(this.opts.url, "latest");

            if (!this._running) {
                return; // not active anymore
            } 

            if (!block.hash || block.hash === this._lastBlockHash) {
                return; // pending block or same block
            }

            this._lastBlockHash = block.hash;
            this.opts.onBlock(block);
        }
        catch (err) {
            this.opts.onError(
                normalizeError(err, "Failed to fetch latest block")
            );
        }
    }
}
