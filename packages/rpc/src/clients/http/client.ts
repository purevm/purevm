import { HttpTransport, type TransportParameters, type RequestOptions } from "./transport.js";
import type { RpcMethod, RpcCall } from "../../types/rpc.types.js";
import { createEthMethods } from "../../api/methods.eth.js";
import { createDebugMethods } from "../../api/methods.debug.js";
import { createTraceMethods } from "../../api/methods.trace.js";

/**
 * Type representing the Eth JSON-RPC methods.
 */
type EthMethods = ReturnType<typeof createEthMethods<RequestOptions>>

/**
 * Type representing the Debug JSON-RPC methods.
 */
type DebugMethods = ReturnType<typeof createDebugMethods<RequestOptions>>

/**
 * Type representing the Trace JSON-RPC methods.
 */
type TraceMethods = ReturnType<typeof createTraceMethods<RequestOptions>>

/**
 * The HTTP client for the PureVM.
 */
export class HttpClient {
    /** The HTTP transport */
    private readonly _transport: HttpTransport;
    /** The Eth JSON-RPC client */
    readonly eth: EthMethods;
    /** The Debug JSON-RPC client */
    readonly debug: DebugMethods;
    /** The Trace JSON-RPC client */
    readonly trace: TraceMethods;

    // ===========================
    // Constructor
    // ===========================

    constructor(parameters: TransportParameters) {
        this._transport = new HttpTransport(parameters);

        this.eth = createEthMethods<RequestOptions>(this);
        this.debug = createDebugMethods<RequestOptions>(this);
        this.trace = createTraceMethods<RequestOptions>(this);
    }

    // ===========================
    // Eth Methods
    // ===========================

    request<M extends RpcMethod>(call: RpcCall<M>, options?: RequestOptions): Promise<M['result']> {
        return this._transport.request(call, options)
    }
}