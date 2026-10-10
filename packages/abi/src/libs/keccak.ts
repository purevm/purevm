// Keccak-256 comes from @noble/hashes, the audited implementation viem uses too
// (Cure53, sha3 in scope): the only runtime dependency of this package.
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { Hex } from "../abi.types.ts";

/** Keccak-256 of `bytes` (Ethereum's, not SHA3-256), as lowercase hex. */
export const keccak256 = (bytes: Uint8Array): Hex => `0x${bytesToHex(keccak_256(bytes))}`;
