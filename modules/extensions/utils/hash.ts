import type { Hash } from "@purevm/public";

import { ExtensionDataError } from "../errors/index.js";

const HASH_PATTERN = /^0x[\dA-Fa-f]{64}$/;

export function normalizeHash<hash extends Hash>(value: hash, label: string): hash {
  if (!HASH_PATTERN.test(value)) {
    throw new ExtensionDataError(`${label} must be a 32-byte hexadecimal hash`);
  }

  return value.toLowerCase() as hash;
}
