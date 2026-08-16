import type { TransportReconnectParameters } from './transport.types.js';

/**
 * Reconnect manager for the WebSocket transport
 */
export class TransportReconnectManager {
    private readonly _minDelay: number;
    private readonly _maxDelay: number;
    private readonly _factor: number;   
    private readonly _jitter: number;

    private _timer: ReturnType<typeof setTimeout> | undefined = undefined;
    private _attempt: number = 0;
    private _enabled: boolean = false;

    /**
     * Constructor
     * @param options - Reconnect options for the WebSocket transport (see {@link TransportReconnectParameters})
     */
    constructor(options: TransportReconnectParameters) {
        this._minDelay = options.minDelay ?? 500;
        this._maxDelay = options.maxDelay ?? 10_000;
        this._factor = options.factor ?? 2;
        this._jitter = options.jitter ?? 0.2;
    }

    /**
     * Enable the reconnect manager
     */
    public enable(): void {
        this._enabled = true;
    }

    /**
     * Disable the reconnect manager
     */
    public disable(): void {
        this._enabled = false;
        this.cancel();
    }

    /**
     * Reset the reconnect attempt
     */
    public reset(): void {
        this._attempt = 0;
    }

    /**
     * Schedule a reconnect
     * @param reconnect - The function to call when the reconnect is scheduled
     */
    public schedule(reconnect: () => Promise<void>): void {
        if (!this._enabled || this._timer) return;

        const exponentialDelay = Math.min(
            this._maxDelay,
            this._minDelay * this._factor ** this._attempt++,
        );

        const jitter = exponentialDelay * this._jitter * (Math.random() * 2 - 1);
        const delay = Math.max(0, exponentialDelay + jitter);

        this._timer = setTimeout(() => {
            this._timer = undefined;
            void reconnect().catch(() => { });
        }, delay);
    }

    /**
     * Cancel the reconnect
     */
    public cancel(): void {
        if (!this._timer) {
            return; // No reconnect timer to cancel
        }
        clearTimeout(this._timer);
        this._timer = undefined;
    }
}
