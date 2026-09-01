import type { BlockHeader, BlockSource, NewBlocksEvent } from "./types.js";

export type BlockStateResult =
  | { event: NewBlocksEvent; status: "accepted" }
  | { status: "duplicate" | "old" };

export class BlockState {
  private current?: BlockHeader;

  clear(): void {
    this.current = undefined;
  }

  update(block: BlockHeader, source: BlockSource): BlockStateResult {
    const previous = this.current;
    if (!previous) {
      this.current = block;
      return { event: { block, source, type: "block" }, status: "accepted" };
    }

    if (block.number < previous.number) return { status: "old" };
    if (block.number === previous.number && block.hash === previous.hash) {
      return { status: "duplicate" };
    }

    this.current = block;
    if (block.number === previous.number) {
      return {
        event: { block, kind: "replacement", previous, source, type: "reorg" },
        status: "accepted",
      };
    }

    if (block.number > previous.number + 1n) {
      return {
        event: {
          block,
          missing: {
            count: block.number - previous.number - 1n,
            from: previous.number + 1n,
            to: block.number - 1n,
          },
          previous,
          source,
          type: "gap",
        },
        status: "accepted",
      };
    }

    if (block.parentHash !== previous.hash) {
      return {
        event: { block, kind: "parent-mismatch", previous, source, type: "reorg" },
        status: "accepted",
      };
    }

    return { event: { block, previous, source, type: "block" }, status: "accepted" };
  }
}
