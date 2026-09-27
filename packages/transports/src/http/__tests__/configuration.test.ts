import { expect, test } from "vitest";

import { createHeaders } from "../headers.js";
import { parseHttpUrl } from "../url.js";

test("normalizes HTTP URLs and extracts basic authorization", () => {
  expect(parseHttpUrl("https://user:p%40ss@rpc.example.com/path")).toEqual({
    authorization: "Basic dXNlcjpwQHNz",
    url: "https://rpc.example.com/path",
  });
});

test("encodes non-Latin-1 credentials as UTF-8", () => {
  const { authorization } = parseHttpUrl("https://%C3%A9l%C3%A8ve:m%C3%B8t@rpc.example.com");
  const encoded = authorization?.replace("Basic ", "") ?? "";

  expect(new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)))).toBe(
    "élève:møt",
  );
});

test.each(["ws://rpc.example.com", "file:///tmp/rpc", " https://rpc.example.com"])(
  "rejects invalid HTTP URL %s",
  (url) => {
    expect(() => parseHttpUrl(url)).toThrow(TypeError);
  },
);

test("merges headers with request precedence", () => {
  const headers = createHeaders(
    "Basic default",
    { authorization: "Bearer transport", "x-value": "transport" },
    { authorization: "Bearer request", "content-type": "custom/type", "x-value": "request" },
  );

  expect(Object.fromEntries(headers)).toMatchObject({
    authorization: "Bearer request",
    "content-type": "custom/type",
    "x-value": "request",
  });
});
