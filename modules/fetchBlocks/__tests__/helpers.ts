import type { HttpClient, HttpRequestOptions } from "@purevm/rpc-public";

import type { FetchContext } from "../fetch-context.js";
import { createLimiter } from "../limiter.js";

/** Builds a fetch context around a partial fake client. */
export function fakeContext(
  client: Partial<Record<keyof HttpClient, unknown>>,
  requestOptions: HttpRequestOptions = {},
  concurrency = 5,
): FetchContext {
  return {
    client: client as unknown as HttpClient,
    limit: createLimiter(concurrency),
    requestOptions,
  };
}
