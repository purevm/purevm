import type { BlockHeader } from "./types.js";

/**
 * How a header relates to the emitted chain:
 * - `first`: nothing emitted yet.
 * - `next`: extends the head.
 * - `duplicate`: this exact header was already emitted.
 * - `stale`: older than the remembered history, so it cannot be classified.
 * - `replacement`: a remembered height with another hash.
 * - `parent-mismatch`: the next height, but it does not extend the head.
 * - `gap`: one or more heights are missing between the head and this header.
 */
export type BlockRelation =
  | "duplicate"
  | "first"
  | "gap"
  | "next"
  | "parent-mismatch"
  | "replacement"
  | "stale";

/** Emitted head plus a bounded window of recent headers keyed by height. */
export class BlockState {
  private readonly history = new Map<bigint, BlockHeader>();
  private readonly historySize: number;
  private current?: BlockHeader | undefined;

  constructor(historySize: number) {
    this.historySize = historySize;
  }

  get head(): BlockHeader | undefined {
    return this.current;
  }

  at(number: bigint): BlockHeader | undefined {
    return this.history.get(number);
  }

  relation(block: BlockHeader): BlockRelation {
    const head = this.current;
    if (!head) return "first";
    if (block.number <= head.number) {
      const known = this.history.get(block.number);
      if (!known) return "stale";
      return known.hash === block.hash ? "duplicate" : "replacement";
    }
    if (block.number === head.number + 1n) {
      return block.parentHash === head.hash ? "next" : "parent-mismatch";
    }
    return "gap";
  }

  /** Makes `block` the head, forgetting every remembered height at or above it. */
  accept(block: BlockHeader): void {
    for (const number of this.history.keys()) {
      if (number >= block.number) this.history.delete(number);
    }
    this.history.set(block.number, block);
    this.current = block;
    for (const number of this.history.keys()) {
      if (this.history.size <= this.historySize) break;
      this.history.delete(number);
    }
  }

  clear(): void {
    this.history.clear();
    this.current = undefined;
  }
}
