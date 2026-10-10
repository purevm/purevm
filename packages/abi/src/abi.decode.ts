/* Executes compiled ABI nodes and reports the furthest byte consumed. */
import { Cursor } from "./abi.cursor.ts";
import { frameAt, type Node } from "./abi.nodes.ts";
import type { AbiParameter, Hex } from "./abi.types.ts";
import { AbiDecodingDataSizeTooSmallError, AbiDecodingZeroDataError } from "./errors.viem.ts";
import { hexToBytes, size } from "./hex.ts";

export type DecodedValues = {
  readonly values: readonly unknown[];
  /** Byte after the last value read, tails included. */
  readonly end: number;
  /** Size of the data in bytes. */
  readonly length: number;
};

/** Decodes one non-hashed indexed parameter without allocating aggregate result arrays. */
export function decodeValue(
  node: Node,
  param: AbiParameter,
  data: Hex,
  validatedBytes?: Uint8Array | undefined,
): unknown {
  const bytes = validatedBytes ?? hexToBytes(data);
  if (bytes.length === 0) {
    throw new AbiDecodingZeroDataError();
  }
  const dataSize = validatedBytes?.length ?? size(data);
  if (dataSize < 32) {
    throw new AbiDecodingDataSizeTooSmallError({ params: [param], size: dataSize });
  }

  const cursor = new Cursor(bytes);
  const frame = frameAt(0, node.size);
  const [value] = node.read(cursor, 0, frame);
  return value;
}

/** Decodes `data` as `params`, whose compiled nodes are `nodes`. */
export function decodeValues(
  nodes: readonly Node[],
  params: readonly AbiParameter[],
  headSize: number,
  data: Hex,
  validatedBytes?: Uint8Array | undefined,
): DecodedValues {
  const bytes = validatedBytes ?? hexToBytes(data);
  const cursor = new Cursor(bytes);

  if (bytes.length === 0 && nodes.length > 0) {
    throw new AbiDecodingZeroDataError();
  }
  const dataSize = validatedBytes?.length ?? size(data);
  if (dataSize && dataSize < 32) {
    throw new AbiDecodingDataSizeTooSmallError({ params, size: dataSize });
  }

  const frame = frameAt(0, headSize);
  let consumed = 0;
  const values: unknown[] = [];
  for (const node of nodes) {
    // Zero-width types (e.g. `uint256[0]`, empty tuples) at the end of the
    // data consume no bytes, so the cursor may already be exhausted.
    if (consumed < bytes.length) {
      cursor.setPosition(consumed);
    }
    const [value, nodeConsumed] = node.read(cursor, 0, frame);
    consumed += nodeConsumed;
    values.push(value);
  }
  return { values, end: frame.end, length: bytes.length };
}
