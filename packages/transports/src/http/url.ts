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
  // btoa only accepts Latin-1, so encode UTF-8 bytes first.
  let binary = "";
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
