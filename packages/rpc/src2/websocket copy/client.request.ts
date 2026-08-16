import { RpcRequestTimeoutError, JsonRpcErrorObject, WebSocketConnectionError } from './errors2.js'
import type { JsonRpcId, JsonRpcRequest, JsonRpcResponse, JsonRpcSubscriptionNotification } from './client.types.js';
import { type WebSocketTransport } from './transport.js';
import { createRequestIdGenerator, type RequestIdGenerator } from '@/utils/request-id-generator.js';


export type WebSocketRequestManagerOptions = {
    timeout: number
    send: (data: string) => Promise<void>
}

type PendingRequest = {
    method: string
    resolve: (result: unknown) => void
    reject: (error: Error) => void
    timer: ReturnType<typeof setTimeout>
}

export class WebSocketRequestManager {
    private readonly send: (data: string) => Promise<void>
    private readonly timeout: number
    private readonly pending = new Map<JsonRpcId, PendingRequest>()
    private readonly requestIdGenerator: RequestIdGenerator;

    constructor(options: WebSocketRequestManagerOptions) {
        this.send = options.send;
        this.timeout = options.timeout ?? 10_000;
        this.requestIdGenerator = createRequestIdGenerator();
    }

    async request<result = unknown>(request: JsonRpcRequest): Promise<result> {
        const id = this.requestIdGenerator.next();
        const method = request.method;
        const params = request.params ?? [];
        const timeout = request.timeout ?? this.timeout;

        return new Promise<result>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new RpcRequestTimeoutError(method, timeout));
            }, timeout);

            this.pending.set(id, {
                method, 
                resolve: resolve as (result: unknown) => void, 
                reject, 
                timer 
            });

            const body = JSON.stringify({
                id,
                jsonrpc: '2.0',
                method,
                params,
            });

            void this.send(body).catch((error) => {
                const pending = this.pending.get(id)
                if (!pending) return
                clearTimeout(pending.timer)
                this.pending.delete(id)
                pending.reject(asError(error))
            })
        })
    }

    async handleResponse(message: Record<string, unknown>) {
        if (message["jsonrpc"] !== "2.0") {
            // JSON-RPC response must specify version "2.0"
            throw ResponseErrors.invalid({ response: json });
        }

        if (typeof message["id"] !== 'number' && typeof message["id"] !== 'string') {
            // JSON-RPC response has an invalid id
            throw ResponseErrors.invalid({ response: json });
        }
        
        const pending = this.pending.get(message["id"]);
        if (!pending) {
            return; // No pending request found for ID
        }

        clearTimeout(pending.timer);
        this.pending.delete(message["id"]);
        
        const hasResult = Object.hasOwn(message, 'result');
        const hasError = Object.hasOwn(message, 'error');

        if (hasResult === hasError) {
            // JSON-RPC response must contain exactly one of "result" or "error", not both
            throw ResponseErrors.invalid({ response: json });
        }

        if (hasError) {
            const error = new JsonRpcErrorObject(message['error']);
            pending.reject(error);
            return
        }

        pending.resolve(message['result'])
    }

    /**
     * Rejects all pending requests.
     */
    public rejectPending(error: Error) {
        for (const pending of this.pending.values()) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
        this.pending.clear();
    }

    // ================================
    // Private Methods
    // ================================

}


function isJsonRpcError(value: unknown): value is JsonRpcErrorObject {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as JsonRpcErrorObject).code === 'number' &&
      typeof (value as JsonRpcErrorObject).message === 'string'
    )
  }
  
  function asError(error: unknown) {
    return error instanceof Error
      ? error
      : new WebSocketConnectionError('Unknown WebSocket error.', {
          cause: error,
        })
  }
  