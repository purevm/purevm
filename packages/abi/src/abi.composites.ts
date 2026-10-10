/* Reader nodes for arrays and tuples, including their nested offset frames. */
import type { Cursor } from "./abi.cursor.ts";
import {
  closeTail,
  frameAt,
  readOffset,
  safeAddSize,
  safeMultiplySize,
  type Node,
} from "./abi.nodes.ts";
import { bytesToNumber } from "./utils/bytes.ts";

/**
 * Charges a zero-width element (`uint256[0]`) against the read limit, to bound the work on huge
 * lengths of them (`uint256[0][]`, `uint256[0][4294967295]`).
 */
const chargeZeroWidth = (cursor: Cursor, consumed: number): void => {
  if (consumed !== 0) return;
  cursor.chargeRead();
};

/** `T[]` when `length` is `null`, `T[length]` otherwise (`T[0]` is fixed, not dynamic). */
export const arrayNode = (
  element: Node,
  length: number | null,
  type: string,
  canonicalOffsets: boolean,
): Node => {
  if (length === null) {
    return {
      dynamic: true,
      size: 32,
      read: (cursor, staticPosition, frame) => {
        const start = readOffset(cursor, staticPosition, canonicalOffsets, frame, type);
        const startOfData = safeAddSize(start, 32);
        cursor.setPosition(start);
        const count = bytesToNumber(cursor.readBytes(32));
        const inner = frameAt(startOfData, safeMultiplySize(count, element.size));
        // Dynamic elements are one offset slot each; static ones follow each other.
        let consumed = 0;
        const value: unknown[] = [];
        for (let index = 0; index < count; index++) {
          cursor.setPosition(startOfData + (element.dynamic ? index * 32 : consumed));
          const [data, elementConsumed] = element.read(cursor, startOfData, inner);
          consumed += elementConsumed;
          value.push(data);
          chargeZeroWidth(cursor, elementConsumed);
        }
        cursor.setPosition(staticPosition + 32);
        closeTail(frame, inner.end);
        return [value, 32];
      },
    };
  }

  if (element.dynamic) {
    return {
      dynamic: true,
      size: 32,
      // An offset to one offset slot per element.
      read: (cursor, staticPosition, frame) => {
        const start = readOffset(cursor, staticPosition, canonicalOffsets, frame, type);
        const inner = frameAt(start, safeMultiplySize(length, 32));
        const value: unknown[] = [];
        for (let index = 0; index < length; index++) {
          cursor.setPosition(start + index * 32);
          const [data] = element.read(cursor, start, inner);
          value.push(data);
        }
        cursor.setPosition(staticPosition + 32);
        closeTail(frame, inner.end);
        return [value, 32];
      },
    };
  }

  return {
    dynamic: false,
    size: safeMultiplySize(length, element.size),
    // Deeply static: the elements inline, in sequence.
    read: (cursor, staticPosition, frame) => {
      let consumed = 0;
      const value: unknown[] = [];
      for (let index = 0; index < length; index++) {
        const [data, elementConsumed] = element.read(cursor, staticPosition + consumed, frame);
        consumed += elementConsumed;
        value.push(data);
        chargeZeroWidth(cursor, elementConsumed);
      }
      return [value, consumed];
    },
  };
};

/** A tuple always follows its component order, independently of component names. */
/**
 * A tuple: an object when every component is named, an array otherwise (like viem). Names are own
 * properties, so that `__proto__` keeps its value.
 */
export const tupleNode = (
  components: readonly Node[],
  names: readonly (string | undefined)[],
  type: string,
  canonicalOffsets: boolean,
): Node => {
  const named = components.length > 0 && names.every((name) => !!name);
  const create = (): unknown[] | Record<string, unknown> => (named ? {} : []);
  const put = (value: unknown[] | Record<string, unknown>, index: number, data: unknown): void => {
    if (named) {
      Object.defineProperty(value, names[index]!, {
        value: data,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    } else {
      (value as unknown[])[index] = data;
    }
  };
  let headSize = 0;
  let dynamic = false;
  for (const component of components) {
    headSize = safeAddSize(headSize, component.size);
    dynamic ||= component.dynamic;
  }
  if (dynamic) {
    return {
      dynamic: true,
      size: 32,
      read: (cursor, staticPosition, frame) => {
        const start = readOffset(cursor, staticPosition, canonicalOffsets, frame, type);
        const inner = frameAt(start, headSize);
        const value = create();
        let consumed = 0;
        for (let index = 0; index < components.length; index++) {
          const component = components[index];
          if (component === undefined) continue;
          cursor.setPosition(start + consumed);
          const [data, componentConsumed] = component.read(cursor, start, inner);
          consumed += componentConsumed;
          put(value, index, data);
        }
        cursor.setPosition(staticPosition + 32);
        closeTail(frame, inner.end);
        return [value, 32];
      },
    };
  }

  return {
    dynamic: false,
    size: headSize,
    read: (cursor, staticPosition, frame) => {
      const value = create();
      let consumed = 0;
      for (let index = 0; index < components.length; index++) {
        const component = components[index];
        if (component === undefined) continue;
        const [data, componentConsumed] = component.read(cursor, staticPosition, frame);
        put(value, index, data);
        consumed += componentConsumed;
      }
      return [value, consumed];
    },
  };
};
