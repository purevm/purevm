import type { BlockHeader } from "./types.js";

export type BlockLatency = {
  /**
   * Milliseconds between the block timestamp and its reception by this process. Block timestamps
   * have one-second precision, so the value is accurate to about a second and can be slightly
   * negative when local and producer clocks differ.
   */
  propagationMs: number;
  /** Milliseconds between the reception of `previous` and of this block, when given. */
  sincePreviousMs?: number | undefined;
};

/** Measures how late a header arrived, from its timestamp and from the previous header. */
export function blockLatency(block: BlockHeader, previous?: BlockHeader): BlockLatency {
  const propagationMs = block.receivedAt - Number(block.timestamp) * 1_000;
  if (!previous) return { propagationMs };
  return { propagationMs, sincePreviousMs: block.receivedAt - previous.receivedAt };
}
