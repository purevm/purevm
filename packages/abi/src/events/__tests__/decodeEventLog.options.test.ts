import { describe, expect, test } from "vitest";
// viem is a devDependency: the reference result once a check is turned off.
import {
  decodeEventLog as viemDecodeEventLog,
  toEventSelector,
  type AbiEvent,
  type AbiParameter,
  type Hex,
} from "viem";

import { BaseError } from "../../errors.base.ts";
import { InvalidAbiSignatureError, InvalidByteSequenceError } from "../../errors.encoding.ts";
import {
  DataAlignmentError,
  DataTooLongError,
  DirtyPaddingError,
  InvalidAbiTypeError,
  InvalidHexError,
  NonCanonicalOffsetError,
  SizeOutOfRangeError,
} from "../../errors.validation.ts";
import {
  AbiEventNameMismatchError,
  InvalidAbiEventError,
  InvalidEventLogInputError,
  InvalidTopicSizeError,
  TooManyTopicsError,
} from "../log.errors.ts";
import {
  AbiDecodingDataSizeTooSmallError,
  IntegerOutOfRangeError,
  InvalidBytesBooleanError,
  RecursiveReadLimitExceededError,
} from "../../errors.viem.ts";
import { AbiEventSignatureNotFoundError, DecodeLogDataMismatch } from "../log.errors.ts";
import { compileEventLogDecoder } from "../log.compile.ts";
import { decodeEventLog as decodeEventLog_ } from "../log.decode.ts";
import type { DecodeEventLogOptions } from "../log.types.ts";

const decodeEventLog = (parameters: any): any => {
  const { abi, abiTopic0, data, eventName, options, topics } = parameters;
  return decodeEventLog_({
    abi,
    abiTopic0,
    eventName,
    options,
    payload: { topics, data },
  } as never);
};

/** One 32-byte word, as hex digits. */
const word = (value: bigint | number): string => BigInt(value).toString(16).padStart(64, "0");
/** "hi", padded to a word. */
const HI = `6869${"00".repeat(30)}`;

/** A log as both decoders take it, with an ABI array. */
type Log = { abi: readonly unknown[]; topics: [Hex, ...Hex[]]; data?: Hex | undefined };

/** Tuples decode like viem's (an object when all components are named): only the top level is positional. */
const toPositionalValue = (_param: AbiParameter, value: unknown): unknown => value;

const positionalViem = (log: Log): unknown => {
  const event = log.abi.find(
    (item): item is AbiEvent =>
      item !== null && typeof item === "object" && (item as { type?: unknown }).type === "event",
  );
  if (event === undefined) throw new Error("test log has no event");
  const decoded = viemDecodeEventLog(log as Parameters<typeof viemDecodeEventLog>[0]);
  if (decoded.args === undefined) return decoded;
  const record = decoded.args as Record<string, unknown>;
  return {
    eventName: decoded.eventName,
    args: event.inputs.map((param, index) =>
      toPositionalValue(
        param,
        Array.isArray(decoded.args) ? decoded.args[index] : record[param.name ?? ""],
      ),
    ),
  };
};

/** The error `decode` throws. */
const errorOf = (decode: () => unknown): unknown => {
  try {
    decode();
  } catch (error) {
    return error;
  }
  throw new Error("expected an error");
};

const transfer = {
  type: "event",
  name: "Transfer",
  inputs: [
    { indexed: true, name: "from", type: "address" },
    { indexed: true, name: "to", type: "address" },
    { indexed: false, name: "value", type: "uint256" },
  ],
} as const;
const selector = toEventSelector("Transfer(address,address,uint256)");
const from: Hex = `0x${word(0xd8da6bf26964af9d7eed9e03e53415d37aa96045n)}`;
const to: Hex = `0x${word(0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266n)}`;
const value: Hex = `0x${word(5)}`;

/** A log of an event whose only input `x` is not indexed: topic0, then `x` in the data. */
const single = (type: string, data: string, components?: readonly unknown[]): Log => ({
  abi: [
    {
      type: "event" as const,
      name: "Single",
      inputs: [{ indexed: false, name: "x", type, ...(components ? { components } : {}) }],
    },
  ],
  topics: [toEventSelector(`Single(${components ? signatureOf(type, components) : type})`)],
  data: `0x${data}` as Hex,
});

const anonymousWithIndexedInputs = (count: number) =>
  ({
    type: "event",
    name: "Anonymous",
    anonymous: true,
    inputs: Array.from({ length: count }, (_, index) => ({
      type: "uint256",
      name: `p${index}`,
      indexed: true,
    })),
  }) as const;

/** `(uint256,string)[]` from `tuple[]` and its components. */
const signatureOf = (type: string, components: readonly unknown[]): string =>
  `(${components.map((c) => (c as { type: string }).type).join(",")})${type.slice("tuple".length)}`;

/**
 * The log throws `ErrorClass` with the default checks, and decodes like viem once `option` alone
 * is off: the other checks stay on and must not be what rejects it.
 */
const rejects = (
  log: Log,
  ErrorClass: abstract new (...args: never[]) => BaseError,
  option: keyof DecodeEventLogOptions,
): void => {
  expect(errorOf(() => decodeEventLog(log))).toBeInstanceOf(ErrorClass);
  expect(
    decodeEventLog({ ...log, options: { addressFormat: "checksum", [option]: false } }),
  ).toStrictEqual(positionalViem(log));
};

test("a canonical log passes every check and decodes like viem", () => {
  const log: Log = { abi: [transfer], topics: [selector, from, to], data: value };
  expect(decodeEventLog({ ...log, options: { addressFormat: "checksum" } })).toStrictEqual(
    positionalViem(log),
  );
  const text = single("string", word(32) + word(2) + HI);
  expect(decodeEventLog(text)).toStrictEqual(positionalViem(text));
});

describe("topics", () => {
  test("validateTopicCount: no topic after the last indexed parameter", () => {
    rejects(
      { abi: [transfer], topics: [selector, from, to, value], data: value },
      TooManyTopicsError,
      "validateTopicCount",
    );
  });

  test("validateTopicSize: a longer topic (viem decodes its first word)", () => {
    rejects(
      { abi: [transfer], topics: [selector, `${from}00`, to], data: value },
      InvalidTopicSizeError,
      "validateTopicSize",
    );
  });

  test("validateTopicSize: a shorter topic, before viem's own error", () => {
    const log: Log = { abi: [transfer], topics: [selector, "0x01", to], data: value };
    expect(errorOf(() => decodeEventLog(log))).toBeInstanceOf(InvalidTopicSizeError);
    expect(
      errorOf(() => decodeEventLog({ ...log, options: { validateTopicSize: false } })),
    ).toBeInstanceOf(AbiDecodingDataSizeTooSmallError);
  });

  test("validateTopicSize: the hash of an indexed string (viem returns any topic as is)", () => {
    const hashed = {
      type: "event",
      name: "Named",
      inputs: [{ indexed: true, name: "name", type: "string" }],
    } as const;
    rejects(
      { abi: [hashed], topics: [toEventSelector("Named(string)"), `0x${"ab".repeat(31)}`] },
      InvalidTopicSizeError,
      "validateTopicSize",
    );
  });

  test("validatePadding: clean padding in a topic", () => {
    rejects(
      { abi: [transfer], topics: [selector, `0xff${from.slice(4)}`, to], data: value },
      DirtyPaddingError,
      "validatePadding",
    );
  });
});

describe("data", () => {
  test("validateDataAlignment: whole 32-byte words", () => {
    const log: Log = { abi: [transfer], topics: [selector, from, to], data: `${value}00` };
    expect(errorOf(() => decodeEventLog(log))).toBeInstanceOf(DataAlignmentError);
    // The same extra byte then fails the length check.
    const unaligned = { ...log, options: { validateDataAlignment: false } };
    expect(errorOf(() => decodeEventLog(unaligned))).toBeInstanceOf(DataTooLongError);
    const off = {
      addressFormat: "checksum" as const,
      validateDataAlignment: false,
      validateDataLength: false,
    };
    expect(decodeEventLog({ ...log, options: off })).toStrictEqual(positionalViem(log));
  });

  test("validateDataLength: nothing after the last value", () => {
    rejects(
      { abi: [transfer], topics: [selector, from, to], data: `${value}${word(0)}` },
      DataTooLongError,
      "validateDataLength",
    );
  });

  test("validateDataLength: no data when there is nothing to decode", () => {
    const indexedOnly = {
      type: "event",
      name: "Indexed",
      inputs: [{ indexed: true, name: "from", type: "address" }],
    } as const;
    rejects(
      { abi: [indexedOnly], topics: [toEventSelector("Indexed(address)"), from], data: value },
      DataTooLongError,
      "validateDataLength",
    );
  });

  test("validatePadding: clean padding around every value type", () => {
    rejects(single("uint8", word(0x105)), DirtyPaddingError, "validatePadding");
    rejects(single("uint64", word(1n << 70n)), DirtyPaddingError, "validatePadding");
    rejects(single("int8", word(0x80)), DirtyPaddingError, "validatePadding");
    rejects(single("address", `ff${from.slice(4)}`), DirtyPaddingError, "validatePadding");
    rejects(single("bytes1", `abcd${"00".repeat(30)}`), DirtyPaddingError, "validatePadding");
    rejects(
      single("string", word(32) + word(2) + `6869ff${"00".repeat(29)}`),
      DirtyPaddingError,
      "validatePadding",
    );
  });

  test("validatePadding: inside a nested tuple", () => {
    const components = [
      { name: "a", type: "uint256" },
      { name: "inner", type: "tuple", components: [{ name: "b", type: "uint8" }] },
    ];
    const log = single("tuple", word(1) + word(0x105), components);
    log.topics = [toEventSelector("Single((uint256,(uint8)))")];
    rejects(log, DirtyPaddingError, "validatePadding");
  });

  test("a bool is 0 or 1 whatever the options, like viem", () => {
    const log = single("bool", word(2));
    const off: DecodeEventLogOptions = {
      validateTopicCount: false,
      validateTopicSize: false,
      validateDataAlignment: false,
      validateDataLength: false,
      validateCanonicalOffsets: false,
      validatePadding: false,
    };
    expect(errorOf(() => decodeEventLog(log))).toBeInstanceOf(InvalidBytesBooleanError);
    expect(errorOf(() => decodeEventLog({ ...log, options: off }))).toBeInstanceOf(
      InvalidBytesBooleanError,
    );
  });
});

describe("validateCanonicalOffsets", () => {
  test("a tail right after the head", () => {
    // Offset 64 instead of 32: an unused word between the head and the tail.
    rejects(
      single("string", word(64) + word(0) + word(2) + HI),
      NonCanonicalOffsetError,
      "validateCanonicalOffsets",
    );
  });

  test("tails in order: swapped tails of a string[]", () => {
    const b = `6279${"00".repeat(30)}`;
    // Element offsets 128 then 64 instead of 64 then 128, tails swapped to keep the values.
    rejects(
      single("string[]", word(32) + word(2) + word(128) + word(64) + word(2) + b + word(2) + HI),
      NonCanonicalOffsetError,
      "validateCanonicalOffsets",
    );
  });

  test("one tail per value: two elements sharing a tail", () => {
    rejects(
      single("string[]", word(32) + word(2) + word(64) + word(64) + word(2) + HI),
      NonCanonicalOffsetError,
      "validateCanonicalOffsets",
    );
  });

  test("inside a tuple of an array of tuples", () => {
    const components = [
      { name: "id", type: "uint256" },
      { name: "memo", type: "string" },
    ];
    // The memo of the only element points 96 bytes into it instead of 64.
    const data = word(32) + word(1) + word(32) + word(7) + word(96) + word(0) + word(2) + HI;
    rejects(
      single("tuple[]", data, components),
      NonCanonicalOffsetError,
      "validateCanonicalOffsets",
    );
  });

  test("a truncated nested array is viem's error, checks on or off", () => {
    const log = single("uint256[][]", word(32) + word(1) + word(32) + word(3) + word(1));
    expect(errorOf(() => decodeEventLog(log))).toBeInstanceOf(DecodeLogDataMismatch);
    expect(() => viemDecodeEventLog(log)).toThrow("Data size");
  });
});

describe("one event instead of an ABI", () => {
  test("an anonymous event has no topic0: its arguments start at the first topic", () => {
    const anonymous = {
      type: "event",
      name: "Anon",
      anonymous: true,
      inputs: [
        { indexed: true, name: "who", type: "address" },
        { indexed: false, name: "amount", type: "uint256" },
      ],
    } as const;
    expect(decodeEventLog({ abi: anonymous, topics: [from], data: value })).toStrictEqual({
      eventName: "Anon",
      args: ["0xd8da6bf26964af9d7eed9e03e53415d37aa96045", 5n],
    });
    expect(
      errorOf(() => decodeEventLog({ abi: anonymous, topics: [from, to], data: value })),
    ).toBeInstanceOf(TooManyTopicsError);
  });

  test("a non-anonymous event still checks topic0", () => {
    expect(
      errorOf(() => decodeEventLog({ abi: transfer, topics: [to, from, to], data: value })),
    ).toBeInstanceOf(AbiEventSignatureNotFoundError);
  });

  test("a parameter named __proto__ is positionally decoded", () => {
    const proto = {
      type: "event",
      name: "Proto",
      inputs: [{ indexed: false, name: "__proto__", type: "uint256" }],
    } as const;
    const { args } = decodeEventLog({
      abi: proto,
      topics: [toEventSelector("Proto(uint256)")],
      data: value,
    });
    expect(args).toStrictEqual([5n]);
  });
});

test("every error carries the call: the event found, the topics, the data and the options", () => {
  const topics: [Hex, ...Hex[]] = [selector, from, to, value];
  const options = { validatePadding: true };
  const error = errorOf(() => decodeEventLog({ abi: [transfer], topics, data: value, options }));
  expect(error).toBeInstanceOf(TooManyTopicsError);
  expect(error).toMatchObject({
    abi: transfer,
    topics,
    data: value,
    payload: { topics, data: value },
    options,
    expected: 3,
    count: 4,
  });

  const mismatch = errorOf(() => decodeEventLog({ abi: transfer, topics: [selector, from, to] }));
  expect(mismatch).toBeInstanceOf(DecodeLogDataMismatch);
  expect(mismatch).toMatchObject({ abi: transfer, data: undefined, size: 0 });
});

test("stateless calls do not share their options", () => {
  const log = single("uint8", word(0x105));
  expect(errorOf(() => decodeEventLog(log))).toBeInstanceOf(DirtyPaddingError);
  expect(decodeEventLog({ ...log, options: { validatePadding: false } })).toStrictEqual(
    positionalViem(log),
  );
  expect(errorOf(() => decodeEventLog(log))).toBeInstanceOf(DirtyPaddingError);
});

test("addressFormat selects checksummed, custom-formatted or untouched addresses", () => {
  const log: Log = { abi: [transfer], topics: [selector, from, to], data: value };
  const rawAddresses = [
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  ] as const;

  expect(decodeEventLog(log).args).toStrictEqual([...rawAddresses, 5n]);
  expect(decodeEventLog({ ...log, options: { addressFormat: null } }).args).toStrictEqual([
    ...rawAddresses,
    5n,
  ]);
  expect(decodeEventLog({ ...log, options: { addressFormat: undefined } }).args).toStrictEqual([
    ...rawAddresses,
    5n,
  ]);
  const received: string[] = [];
  const formatted = decodeEventLog({
    ...log,
    options: {
      addressFormat: (address: Hex) => {
        received.push(address);
        return address.toUpperCase().replace("0X", "0x") as Hex;
      },
    },
  });
  expect(received).toStrictEqual(rawAddresses);
  expect(formatted.args).toStrictEqual([
    "0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045",
    "0xF39FD6E51AAD88F6F4CE6AB8827279CFFFB92266",
    5n,
  ]);

  const checksummed = decodeEventLog({ ...log, options: { addressFormat: "checksum" } });
  expect(checksummed.args).toStrictEqual([
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    5n,
  ]);

  const decoder = compileEventLogDecoder({
    abi: transfer,
    abiTopic0: selector,
    options: { addressFormat: null },
  });
  expect(decoder({ topics: [selector, from, to], data: value }).args).toStrictEqual([
    ...rawAddresses,
    5n,
  ]);
  expect(decoder.options.addressFormat).toBeNull();
});

describe("hex and ABI validation", () => {
  test("validateHex rejects odd data and non-hex hashed topics", () => {
    const odd = single("uint256", `${"0".repeat(62)}1`);
    rejects(odd, InvalidHexError, "validateHex");

    const hashed = {
      type: "event",
      name: "Hashed",
      inputs: [{ indexed: true, name: "value", type: "string" }],
    } as const;
    rejects(
      {
        abi: [hashed],
        topics: [toEventSelector("Hashed(string)"), `0x${"zz".repeat(32)}`],
      },
      InvalidHexError,
      "validateHex",
    );
  });

  test.each(["uint7", "uint0", "int257", "bytesfoo"])(
    "validateTypes rejects %s and disabling it restores viem",
    (type) => rejects(single(type, word(1)), InvalidAbiTypeError, "validateTypes"),
  );

  test("validateTypes enforces the indexed-topic limit", () => {
    const event = {
      type: "event",
      name: "Crowded",
      inputs: Array.from({ length: 4 }, (_, index) => ({
        indexed: true,
        name: `p${index}`,
        type: "uint256",
      })),
    } as const;
    const log: Log = {
      abi: [event],
      topics: [
        toEventSelector("Crowded(uint256,uint256,uint256,uint256)"),
        value,
        value,
        value,
        value,
      ],
    };
    rejects(log, InvalidAbiEventError, "validateTypes");
  });

  test("a malformed event always throws a contextual BaseError", () => {
    const malformed = { type: "event", name: "MissingInputs" };
    const error = errorOf(() =>
      decodeEventLog({
        abi: malformed,
        abiTopic0: selector,
        topics: [selector],
        options: { validateTypes: false },
      }),
    );
    expect(error).toBeInstanceOf(InvalidAbiEventError);
    expect(error).toMatchObject({ abi: malformed, abiTopic0: selector });
  });

  test("utility failures use dedicated error classes and carry their input", () => {
    const invalidHex = single("bool", `zz${word(1).slice(2)}`);
    const byteError = errorOf(() =>
      decodeEventLog({ ...invalidHex, options: { validateHex: false } }),
    );
    expect(byteError).toBeInstanceOf(InvalidByteSequenceError);
    expect(byteError).toMatchObject({ sequence: "zz", value: invalidHex.data?.slice(2) });
    expect((byteError as Error).constructor).not.toBe(BaseError);

    const invalidSignature = {
      type: "event",
      name: "Broken",
      inputs: [{ indexed: false, name: "value", type: "uint256(" }],
    } as const;
    const signatureError = errorOf(() =>
      decodeEventLog_({
        abi: invalidSignature,
        options: { validateTypes: false },
        payload: { topics: [selector], data: value },
      }),
    );
    expect(signatureError).toBeInstanceOf(InvalidAbiSignatureError);
    expect(signatureError).toMatchObject({ signature: "Broken(uint256()", abi: invalidSignature });
    expect((signatureError as Error).constructor).not.toBe(BaseError);
  });
});

describe("input and selection validation", () => {
  test("parameters and payload require their documented runtime shape", () => {
    const invalidCalls = [
      () => decodeEventLog_(null as never),
      () => decodeEventLog_([] as never),
      () => decodeEventLog_({ abi: transfer, payload: null } as never),
      () =>
        decodeEventLog_({
          abi: transfer,
          payload: { topics: selector },
        } as never),
      () =>
        decodeEventLog_({
          abi: transfer,
          payload: { topics: [selector], data: 1 },
        } as never),
    ];
    for (const call of invalidCalls) {
      expect(errorOf(call)).toBeInstanceOf(InvalidEventLogInputError);
    }
  });

  test("every option is validated before decoding", () => {
    const booleanOptions = [
      "validateHex",
      "validateTypes",
      "validateTopicCount",
      "validateTopicSize",
      "validateDataAlignment",
      "validateDataLength",
      "validateCanonicalOffsets",
      "validatePadding",
    ] as const;
    for (const name of booleanOptions) {
      expect(
        errorOf(() =>
          compileEventLogDecoder({
            abi: transfer,
            options: { [name]: "yes" } as never,
          }),
        ),
      ).toBeInstanceOf(InvalidEventLogInputError);
    }
    expect(
      errorOf(() =>
        compileEventLogDecoder({ abi: transfer, options: { addressFormat: "lowercase" } as never }),
      ),
    ).toBeInstanceOf(InvalidEventLogInputError);
  });

  test("eventName must match the event selected by topic0", () => {
    const error = errorOf(() =>
      decodeEventLog_({
        abi: [transfer],
        eventName: "Approval" as never,
        payload: { topics: [selector, from, to], data: value },
      }),
    );
    expect(error).toBeInstanceOf(AbiEventNameMismatchError);
    expect(error).toMatchObject({ expected: "Approval", actual: "Transfer", abi: transfer });
  });

  test("validateHex also covers a caller-supplied abiTopic0", () => {
    const abiTopic0 = "0x1" as Hex;
    const error = errorOf(() => compileEventLogDecoder({ abi: transfer, abiTopic0 }));
    expect(error).toBeInstanceOf(InvalidHexError);
    expect(error).toMatchObject({ kind: "abiTopic0", value: abiTopic0 });
  });
});

describe("complete ABI type validation", () => {
  test.each([
    "bytes0",
    "bytes33",
    "uint264",
    "int7",
    "uint256[0]",
    "uint256[01]",
    "uint256[-1]",
    "uint256[9007199254740992]",
  ])("rejects invalid canonical type %s", (type) => {
    expect(errorOf(() => decodeEventLog(single(type, word(1))))).toBeInstanceOf(
      InvalidAbiTypeError,
    );
  });

  test("tuple components are required and only tuples may have them", () => {
    const tupleWithoutComponents = {
      type: "event",
      name: "Tuple",
      inputs: [{ type: "tuple" }],
    } as const;
    expect(errorOf(() => compileEventLogDecoder({ abi: tupleWithoutComponents }))).toBeInstanceOf(
      InvalidAbiTypeError,
    );

    const componentsOnInteger = {
      type: "event",
      name: "Integer",
      inputs: [{ type: "uint256", components: [{ type: "uint256" }] }],
    } as const;
    expect(errorOf(() => compileEventLogDecoder({ abi: componentsOnInteger }))).toBeInstanceOf(
      InvalidAbiEventError,
    );
  });

  test("tuple components cannot be indexed", () => {
    const log = single("tuple", word(1), [{ type: "uint256", indexed: true }]);
    expect(errorOf(() => decodeEventLog(log))).toBeInstanceOf(InvalidAbiEventError);
  });

  test("an anonymous event accepts four indexed values but rejects five", () => {
    expect(() => compileEventLogDecoder({ abi: anonymousWithIndexedInputs(4) })).not.toThrow();
    expect(
      errorOf(() => compileEventLogDecoder({ abi: anonymousWithIndexedInputs(5) })),
    ).toBeInstanceOf(InvalidAbiEventError);
  });

  test("derived sizes must stay within JavaScript's safe integer range", () => {
    const huge = {
      type: "event",
      name: "Huge",
      inputs: [{ type: "uint256[9007199254740991]" }],
    } as const;
    expect(errorOf(() => compileEventLogDecoder({ abi: huge }))).toBeInstanceOf(
      SizeOutOfRangeError,
    );
  });
});

describe("always-on decoding safety", () => {
  test("an offset larger than Number.MAX_SAFE_INTEGER is rejected", () => {
    const error = errorOf(() => decodeEventLog(single("string", word(2n ** 60n) + word(0))));
    expect(error).toBeInstanceOf(IntegerOutOfRangeError);
  });

  test("malicious shared tails are bounded by the recursive read limit", () => {
    const count = 8_200;
    const log = single("string[]", word(32) + word(count) + word(32).repeat(count) + word(0));
    const error = errorOf(() =>
      decodeEventLog({ ...log, options: { validateCanonicalOffsets: false } }),
    );
    expect(error).toBeInstanceOf(RecursiveReadLimitExceededError);
  });

  test("duplicate names cannot overwrite positional arguments", () => {
    const event = {
      type: "event",
      name: "Duplicate",
      inputs: [
        { name: "value", type: "uint256" },
        { name: "value", type: "uint256" },
      ],
    } as const;
    expect(
      decodeEventLog_({
        abi: event,
        payload: {
          topics: [toEventSelector("Duplicate(uint256,uint256)")],
          data: `0x${word(1)}${word(2)}`,
        },
      }),
    ).toStrictEqual({ eventName: "Duplicate", args: [1n, 2n] });
  });
});

describe("stateless and compiled decoding", () => {
  test("abiTopic0 skips signature hashing but is still checked against the payload", () => {
    const event = { type: "event", name: "Broken(", inputs: [] } as const;
    const abiTopic0 = `0x${"12".repeat(32)}` as Hex;
    expect(
      decodeEventLog_({ abi: event, abiTopic0, payload: { topics: [abiTopic0] } }),
    ).toStrictEqual({ eventName: "Broken(", args: undefined });
    expect(
      errorOf(() => decodeEventLog_({ abi: event, abiTopic0, payload: { topics: [selector] } })),
    ).toBeInstanceOf(AbiEventSignatureNotFoundError);
  });

  test("stateless decoding observes mutations and list additions", () => {
    const event = {
      type: "event",
      name: "Mutable",
      inputs: [{ indexed: false, name: "value", type: "uint256" }],
    };
    const abiTopic0 = toEventSelector("Mutable(uint256)");
    expect(
      decodeEventLog_({ abi: event, abiTopic0, payload: { topics: [abiTopic0], data: value } }),
    ).toMatchObject({ args: [5n] });
    event.inputs[0]!.indexed = true;
    expect(
      decodeEventLog_({ abi: event, abiTopic0, payload: { topics: [abiTopic0, value] } }),
    ).toMatchObject({ args: [5n] });

    const later = { type: "event", name: "Later", inputs: [] } as const;
    const abi: unknown[] = [{ type: "event", name: "First", inputs: [] }];
    decodeEventLog_({ abi, payload: { topics: [toEventSelector("First()")] } });
    abi.push(later);
    expect(
      decodeEventLog_({ abi, payload: { topics: [toEventSelector("Later()")] } }),
    ).toMatchObject({ eventName: "Later" });
  });

  test("a compiled decoder keeps a detached plan and works in an external topic0 map", () => {
    const event = {
      type: "event" as const,
      name: "Compiled",
      inputs: [{ indexed: false, name: "value", type: "uint256" }],
    };
    const abiTopic0 = toEventSelector("Compiled(uint256)");
    const decoder = compileEventLogDecoder({ abi: event, abiTopic0 });
    const registry = new Map([[abiTopic0, decoder]]);

    event.name = "Mutated";
    event.inputs[0]!.indexed = true;
    expect(registry.get(abiTopic0)!({ topics: [abiTopic0], data: value })).toStrictEqual({
      eventName: "Compiled",
      args: [5n],
    });
    expect(decoder.abi).not.toBe(event);
    expect(decoder.abiTopic0).toBe(abiTopic0);
    expect(Object.isFrozen(decoder.options)).toBe(true);
  });
  test("a compiled ABI decoder finds each event by topic0, like decodeEventLog with the ABI", () => {
    const approval = {
      type: "event",
      name: "Approval",
      inputs: [{ indexed: false, name: "amount", type: "uint256" }],
    } as const;
    const abi = [
      { type: "constructor", inputs: [], stateMutability: "nonpayable" },
      transfer,
      approval,
    ];
    const decoder = compileEventLogDecoder({ abi });
    const logs: readonly { topics: readonly Hex[]; data: Hex }[] = [
      { topics: [selector, from, to], data: value },
      { topics: [toEventSelector("Approval(uint256)")], data: value },
    ];
    for (const log of logs) {
      expect(decoder(log)).toStrictEqual(decodeEventLog_({ abi, payload: log }));
    }
    expect(decoder.abi).toHaveLength(2);
    expect(decoder.abiTopic0).toBeUndefined();
  });

  test("the first event of a selector wins, like viem's abi.find", () => {
    const first = {
      type: "event",
      name: "Same",
      inputs: [{ indexed: false, name: "a", type: "uint256" }],
    } as const;
    const second = { ...first, inputs: [{ indexed: false, name: "b", type: "uint256" }] } as const;
    const decoder = compileEventLogDecoder({ abi: [first, second] });
    const topics = [toEventSelector("Same(uint256)")] as const;
    expect(decoder({ topics, data: value })).toStrictEqual(
      decodeEventLog_({ abi: [first, second], payload: { topics, data: value } }),
    );
  });

  test("an unknown topic0 is AbiEventSignatureNotFoundError, with the compiled ABI as context", () => {
    const decoder = compileEventLogDecoder({ abi: [transfer] });
    const topics = [`0x${word(1)}`] as [Hex];
    const error = errorOf(() => decoder({ topics }));
    expect(error).toBeInstanceOf(AbiEventSignatureNotFoundError);
    expect(error).toMatchObject({ abi: decoder.abi, topics });
  });

  test("errors after the lookup carry the event found", () => {
    const decoder = compileEventLogDecoder({ abi: [transfer] });
    const error = errorOf(() => decoder({ topics: [selector, from, to, value], data: value }));
    expect(error).toBeInstanceOf(TooManyTopicsError);
    expect((error as BaseError & { abi: AbiEvent }).abi.name).toBe("Transfer");
  });

  test("a compiled ABI decoder is detached from later changes to the ABI", () => {
    const event = {
      type: "event" as const,
      name: "Detached",
      inputs: [{ indexed: false, name: "value", type: "uint256" }],
    };
    const abi: unknown[] = [event];
    const decoder = compileEventLogDecoder({ abi });
    const topics = [toEventSelector("Detached(uint256)")] as const;
    event.inputs[0]!.indexed = true;
    abi.push({ type: "event", name: "Later", inputs: [] });
    expect(decoder({ topics, data: value })).toStrictEqual({ eventName: "Detached", args: [5n] });
    expect(errorOf(() => decoder({ topics: [toEventSelector("Later()")] }))).toBeInstanceOf(
      AbiEventSignatureNotFoundError,
    );
    expect(Object.isFrozen(decoder.abi)).toBe(true);
    expect(decoder.abi[0]).not.toBe(event);
  });

  test("compiling an ABI rejects abiTopic0 and malformed events, and ignores other items", () => {
    expect(
      errorOf(() => compileEventLogDecoder({ abi: [transfer], abiTopic0: selector } as never)),
    ).toBeInstanceOf(InvalidAbiEventError);
    expect(
      errorOf(() => compileEventLogDecoder({ abi: [{ type: "event", name: "NoInputs" }] })),
    ).toBeInstanceOf(InvalidAbiEventError);
    expect(
      compileEventLogDecoder({ abi: [null, 1, { type: "error" }, transfer] }).abi,
    ).toHaveLength(1);
  });
});
