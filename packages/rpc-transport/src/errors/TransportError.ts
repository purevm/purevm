export type TransportErrorOptions = {
  cause?: unknown;
  code: string;
  retryable: boolean;
};

export class TransportError extends Error {
  override readonly name = this.constructor.name;
  readonly code: string;
  readonly retryable: boolean;

  constructor(message: string, options: TransportErrorOptions) {
    super(message, { cause: options.cause });
    this.code = options.code;
    this.retryable = options.retryable;
  }
}
