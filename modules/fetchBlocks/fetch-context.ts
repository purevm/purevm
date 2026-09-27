import type { HttpClient, HttpRequestOptions } from "@purevm/public";

import type { Limiter } from "./limiter.js";

/** Shared by every request of one `fetchBlocks` call. */
export type FetchContext = {
  client: HttpClient;
  /** Bounds concurrent requests across blocks, logs, and traces, including split ranges. */
  limit: Limiter;
  /** Request options, with a signal aborted as soon as any request fails for good. */
  requestOptions: HttpRequestOptions;
};
