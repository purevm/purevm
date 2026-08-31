import type { HttpUrl } from "./types.js";

export type ParsedHttpUrl = {
  url: HttpUrl;
  authorization?: string;
};

export function parseHttpUrl(value: string): ParsedHttpUrl {
  if (value.trim() !== value) throw new TypeError("HTTP URL contains surrounding whitespace.");

  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("HTTP URL must use http: or https:.");
  }

  let authorization: string | undefined;
  if (url.username || url.password) {
    const credentials = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
    authorization = `Basic ${encodeBase64(credentials)}`;
    url.username = "";
    url.password = "";
  }

  return { url: url.toString() as HttpUrl, authorization };
}

function encodeBase64(value: string): string {
  const browser = (globalThis as { btoa?: (input: string) => string }).btoa;
  return browser ? browser(value) : Buffer.from(value, "utf8").toString("base64");
}
