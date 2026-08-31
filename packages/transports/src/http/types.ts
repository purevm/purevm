import type { RequestOptions, TransportOptions } from "../types.js";

export type HttpUrl = `http://${string}` | `https://${string}`;

export type HttpHeaders = ConstructorParameters<typeof Headers>[0];

export type HttpTransportOptions = TransportOptions & {
  url: HttpUrl | string;
  headers?: HttpHeaders;
  fetch?: typeof globalThis.fetch;
};

export type HttpRequestOptions = RequestOptions & {
  headers?: HttpHeaders;
};
