import type { BlockHash, BlockNumber } from "@purevm/rpc";

import type { BlockHead, HeadSource, NewHeadsEvent, RpcHead, RpcLatestBlock } from "./types.js";

export function parseBlockHead(value: RpcHead | RpcLatestBlock): BlockHead {
  if (!isBlockNumber(value.number)) throw new Error("Block head has an invalid number");
  if (!isBlockHash(value.hash)) throw new Error("Block head has an invalid hash");

  return {
    hash: value.hash.toLowerCase() as BlockHash,
    number: BigInt(value.number),
    numberHex: value.number,
  };
}

export class HeadState {
  private current?: BlockHead;

  get latest(): BlockHead | undefined {
    return this.current;
  }

  clear(): void {
    this.current = undefined;
  }

  update(head: BlockHead, source: HeadSource): NewHeadsEvent | undefined {
    const previous = this.current;
    if (previous && head.number < previous.number) return undefined;
    if (previous && head.number === previous.number && head.hash === previous.hash) {
      return undefined;
    }

    this.current = head;
    return previous && head.number === previous.number
      ? { head, previous, source, type: "reorg" }
      : { head, source, type: "head" };
  }
}

function isBlockNumber(value: unknown): value is BlockNumber {
  return typeof value === "string" && /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value);
}

function isBlockHash(value: unknown): value is BlockHash {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}
