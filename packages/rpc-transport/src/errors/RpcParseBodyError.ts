import { RpcResponseError } from "./RpcResponseError.js";

export class RpcParseBodyError extends RpcResponseError {
  readonly body: string;

  constructor(body: string, cause?: unknown) {
    super("Failed to parse response body as JSON.", body, cause, "RPC_PARSE_BODY");
    this.body = body;
  }
}
