/* Bounded cursor used by compiled ABI readers. */
import { PositionOutOfBoundsError, RecursiveReadLimitExceededError } from "./errors.viem.ts";

const RECURSIVE_READ_LIMIT = 8_192;

/**
 * Reads through the data. Each re-read of a position counts against a limit of 8 192, which bounds
 * the work on malicious offsets that point back to data already read.
 */
export class Cursor {
  readonly bytes: Uint8Array;
  position: number = 0;
  private readonly positionHistory: number[] = [];
  private positionReadCount: Map<number, number> | undefined;
  private lastReadPosition: number = -1;
  private recursiveReadCount: number = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  /** Charges a read at the current position against the recursive-read limit. */
  chargeRead(): void {
    if (this.recursiveReadCount >= RECURSIVE_READ_LIMIT) {
      throw new RecursiveReadLimitExceededError({
        count: this.recursiveReadCount + 1,
        limit: RECURSIVE_READ_LIMIT,
      });
    }
    this.touch();
  }

  private assertPosition(position: number): void {
    if (position < 0 || position > this.bytes.length - 1) {
      throw new PositionOutOfBoundsError({ length: this.bytes.length, position });
    }
  }

  /** Reads `length` bytes, then advances by `advanceBy` (`length` by default). */
  readBytes(length: number, advanceBy?: number | undefined): Uint8Array {
    this.chargeRead();
    this.assertPosition(this.position + length - 1);
    const value = this.bytes.subarray(this.position, this.position + length);
    this.position += advanceBy ?? length;
    return value;
  }

  setPosition(position: number): void {
    this.assertPosition(position);
    this.position = position;
  }

  /**
   * While positions only increase, none can repeat, so they are just recorded. The first backward
   * move replays that history into the per-position counts that viem keeps from the start.
   */
  private touch(): void {
    let counts = this.positionReadCount;
    if (counts === undefined && this.position > this.lastReadPosition) {
      this.positionHistory.push(this.position);
      this.lastReadPosition = this.position;
      return;
    }
    if (counts === undefined) {
      counts = new Map();
      for (const position of this.positionHistory) {
        counts.set(position, 1);
      }
      this.positionHistory.length = 0;
      this.positionReadCount = counts;
    }

    const count = counts.get(this.position) ?? 0;
    counts.set(this.position, count + 1);
    if (count > 0) {
      this.recursiveReadCount++;
    }
  }
}
