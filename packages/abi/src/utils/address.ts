import type { Address, Hex } from "../abi.types.ts";
import { keccak256 } from "../libs/keccak.ts";

const textEncoder = new TextEncoder();
const CHECKSUM_UPPERCASE_THRESHOLD = "8".charCodeAt(0);

/** EIP-55 checksum of a lowercase or mixed-case address. */
export function checksumAddress(inputAddress: Hex): Address {
  const hexAddress = inputAddress.substring(2).toLowerCase();
  const hash = keccak256(textEncoder.encode(hexAddress));

  let address = "";
  for (let index = 0; index < hexAddress.length; index++) {
    const char = hexAddress.charAt(index);
    // A hash nibble is 8 or greater exactly when its lowercase character sorts at or after "8".
    address +=
      hash.charCodeAt(index + 2) >= CHECKSUM_UPPERCASE_THRESHOLD ? char.toUpperCase() : char;
  }
  return `0x${address}`;
}
