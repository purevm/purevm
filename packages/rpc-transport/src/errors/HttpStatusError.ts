import {
  getHttpErrorDefinition,
  isRetryableHttpStatus,
  type HttpErrorName,
} from "../constants/index.js";
import { TransportError } from "./TransportError.js";

export class HttpStatusError extends TransportError {
  readonly status: number;
  readonly statusName: HttpErrorName | undefined;
  readonly statusText: string;
  readonly body: string;

  constructor(status: number, statusText: string, body: string, cause?: unknown) {
    const definition = getHttpErrorDefinition(status);
    const normalizedStatusText = statusText.trim();
    const message = normalizedStatusText || definition?.message;
    super(`HTTP ${status}${message ? ` ${message}` : ""}.`, {
      cause,
      code: "HTTP_STATUS",
      retryable: isRetryableHttpStatus(status),
    });
    this.status = status;
    this.statusName = definition?.name;
    this.statusText = normalizedStatusText;
    this.body = body;
  }
}
