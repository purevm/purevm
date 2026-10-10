import { describe, expect, test } from "vitest";
// viem is a devDependency: the reference result once a check is turned off.
import {
  decodeFunctionData as viemDecodeFunctionData,
  decodeFunctionResult as viemDecodeFunctionResult,
  toFunctionSelector,
  type Hex,
} from "viem";

import { InvalidHexError } from "../../errors.validation.ts";
import {
  DataAlignmentError,
  DataTooLongError,
  DirtyPaddingError,
  InvalidAbiTypeError,
  NonCanonicalOffsetError,
} from "../../errors.validation.ts";
import { compileFunctionDataDecoder, compileFunctionResultDecoder } from "../function.compile.ts";
import { decodeFunctionData } from "../function.data.ts";
import {
  AbiFunctionNameMismatchError,
  AbiFunctionNotFoundError,
  AbiFunctionOutputsNotFoundError,
  AbiFunctionSignatureNotFoundError,
  AbiItemAmbiguityError,
  InvalidAbiFunctionError,
  InvalidSelectorSizeError,
  SliceOffsetOutOfBoundsError,
} from "../function.errors.ts";
import { decodeFunctionResult } from "../function.result.ts";
import type { DecodeFunctionOptions } from "../function.types.ts";

// Loosely typed: these tests build ABIs at runtime, which the inference cannot narrow.
const decodeResult = decodeFunctionResult as (parameters: object) => unknown;

/** One 32-byte word, as hex digits. */
const word = (value: bigint | number): string => BigInt(value).toString(16).padStart(64, "0");
/** "hi", padded to a word. */
const HI = `6869${"00".repeat(30)}`;
const ADDRESS = "d8da6bf26964af9d7eed9e03e53415d37aa96045";

/** The error `decode` throws. */
const errorOf = (decode: () => unknown): unknown => {
  try {
    decode();
  } catch (error) {
    return error;
  }
  throw new Error("expected an error");
};

/** A view function `f(<input>) returns (<output>)`. */
const fnOf = (input: string | undefined, output: string | undefined) =>
  ({
    type: "function",
    name: "f",
    stateMutability: "view",
    inputs: input === undefined ? [] : [{ name: "x", type: input }],
    outputs: output === undefined ? [] : [{ name: "y", type: output }],
  }) as const;

const calldataOf = (input: string, args: string): Hex =>
  `${toFunctionSelector(`f(${input})`)}${args}` as Hex;

/** Checksummed addresses (like viem) and the `off` checks disabled. */
const offOptions = (
  off: keyof DecodeFunctionOptions | readonly (keyof DecodeFunctionOptions)[],
): DecodeFunctionOptions => ({
  addressFormat: "checksum",
  ...Object.fromEntries((typeof off === "string" ? [off] : off).map((name) => [name, false])),
});

/** Calldata failing the default checks with `ErrorClass`, decoded like viem once `option` is off. */
const rejectsData = (
  input: string,
  args: string,
  ErrorClass: abstract new (...args: never[]) => Error,
  off: keyof DecodeFunctionOptions | readonly (keyof DecodeFunctionOptions)[],
): void => {
  const options = offOptions(off);
  const abi = [fnOf(input, undefined)];
  const data = calldataOf(input, args);
  expect(errorOf(() => decodeFunctionData({ abi, data }))).toBeInstanceOf(ErrorClass);
  expect(decodeFunctionData({ abi, data, options })).toStrictEqual(
    viemDecodeFunctionData({ abi, data }),
  );
};

/** Return data failing the default checks, decoded like viem once `option` is off. */
const rejectsResult = (
  output: string,
  data: string,
  ErrorClass: abstract new (...args: never[]) => Error,
  off: keyof DecodeFunctionOptions | readonly (keyof DecodeFunctionOptions)[],
): void => {
  const options = offOptions(off);
  const abi = [fnOf(undefined, output)];
  const hex = `0x${data}` as Hex;
  expect(errorOf(() => decodeResult({ abi, data: hex }))).toBeInstanceOf(ErrorClass);
  expect(
    decodeResult({
      abi,
      data: hex,
      options,
    }),
  ).toStrictEqual(viemDecodeFunctionResult({ abi, data: hex } as never));
};

describe("calldata", () => {
  test("canonical calldata passes every check", () => {
    const abi = [fnOf("uint256", undefined)];
    const data = calldataOf("uint256", word(5));
    expect(decodeFunctionData({ abi, data })).toStrictEqual({ functionName: "f", args: [5n] });
  });

  test("validateSelectorSize: calldata shorter than a selector", () => {
    const abi = [fnOf("uint256", undefined)];
    expect(errorOf(() => decodeFunctionData({ abi, data: "0x1234" }))).toBeInstanceOf(
      InvalidSelectorSizeError,
    );
    expect(
      errorOf(() =>
        decodeFunctionData({ abi, data: "0x1234", options: { validateSelectorSize: false } }),
      ),
    ).toBeInstanceOf(AbiFunctionSignatureNotFoundError);
  });

  test("calldata that is only a selector is viem's SliceOffsetOutOfBoundsError", () => {
    const abi = [fnOf("uint256", undefined)];
    expect(
      errorOf(() => decodeFunctionData({ abi, data: toFunctionSelector("f(uint256)") })),
    ).toBeInstanceOf(SliceOffsetOutOfBoundsError);
  });

  test("validateDataAlignment and validateDataLength after the selector", () => {
    rejectsData("uint256", `${word(5)}00`, DataAlignmentError, [
      "validateDataAlignment",
      "validateDataLength",
    ]);
    rejectsData("uint256", `${word(5)}${word(0)}`, DataTooLongError, "validateDataLength");
  });

  test("validateDataLength: no data after the selector of a function without inputs", () => {
    const abi = [fnOf(undefined, undefined)];
    const data = `${toFunctionSelector("f()")}${word(0)}` as Hex;
    expect(errorOf(() => decodeFunctionData({ abi, data }))).toBeInstanceOf(DataTooLongError);
    expect(decodeFunctionData({ abi, data, options: { validateDataLength: false } })).toStrictEqual(
      viemDecodeFunctionData({ abi, data }),
    );
  });

  test("validateCanonicalOffsets and validatePadding on the inputs", () => {
    rejectsData(
      "string",
      word(64) + word(0) + word(2) + HI,
      NonCanonicalOffsetError,
      "validateCanonicalOffsets",
    );
    rejectsData("uint8", word(0x105), DirtyPaddingError, "validatePadding");
    rejectsData(
      "address",
      `ff${word(0).slice(2, 24)}${ADDRESS}`,
      DirtyPaddingError,
      "validatePadding",
    );
  });

  test("validateHex on the calldata and abiSelector", () => {
    const fn = fnOf("uint256", undefined);
    expect(
      errorOf(() =>
        decodeFunctionData({ abi: [fn], data: `${calldataOf("uint256", word(5))}0` as Hex }),
      ),
    ).toBeInstanceOf(InvalidHexError);
    expect(
      errorOf(() =>
        decodeFunctionData({
          abi: fn,
          abiSelector: "0xzz" as Hex,
          data: calldataOf("uint256", word(5)),
        }),
      ),
    ).toBeInstanceOf(InvalidHexError);
  });

  test("validateTypes covers the outputs too", () => {
    const fn = {
      type: "function",
      name: "f",
      stateMutability: "view",
      inputs: [{ name: "x", type: "uint256" }],
      outputs: [{ name: "y", type: "uint7" }],
    } as const;
    const data = calldataOf("uint256", word(5));
    expect(errorOf(() => decodeFunctionData({ abi: [fn], data }))).toBeInstanceOf(
      InvalidAbiTypeError,
    );
    expect(
      decodeFunctionData({ abi: [fn], data, options: { validateTypes: false } }),
    ).toStrictEqual({ functionName: "f", args: [5n] });
  });
});

describe("return data", () => {
  test("canonical return data passes every check", () => {
    expect(decodeResult({ abi: [fnOf(undefined, "uint256")], data: `0x${word(5)}` })).toBe(5n);
  });

  test("validateDataAlignment, validateDataLength, offsets and padding on the outputs", () => {
    rejectsResult("uint256", `${word(5)}00`, DataAlignmentError, [
      "validateDataAlignment",
      "validateDataLength",
    ]);
    rejectsResult("uint256", `${word(5)}${word(0)}`, DataTooLongError, "validateDataLength");
    rejectsResult(
      "string",
      word(64) + word(0) + word(2) + HI,
      NonCanonicalOffsetError,
      "validateCanonicalOffsets",
    );
    rejectsResult("uint8", word(0x105), DirtyPaddingError, "validatePadding");
  });

  test("validateDataLength: no return data for a function without outputs", () => {
    const abi = [fnOf(undefined, undefined)];
    const data = `0x${word(0)}` as Hex;
    expect(errorOf(() => decodeResult({ abi, data }))).toBeInstanceOf(DataTooLongError);
    expect(decodeResult({ abi, data, options: { validateDataLength: false } })).toBe(undefined);
  });

  test("missing outputs is viem's AbiFunctionOutputsNotFoundError", () => {
    const fn = { type: "function", name: "f", stateMutability: "view", inputs: [] } as const;
    expect(errorOf(() => decodeResult({ abi: [fn] as never, data: "0x" }))).toBeInstanceOf(
      AbiFunctionOutputsNotFoundError,
    );
  });
});

describe("selection", () => {
  test("one function: its selector is checked, and functionName must match", () => {
    const fn = fnOf("uint256", undefined);
    const other = calldataOf("uint8", word(5));
    expect(errorOf(() => decodeFunctionData({ abi: fn, data: other }))).toBeInstanceOf(
      AbiFunctionSignatureNotFoundError,
    );
    expect(
      errorOf(() =>
        decodeFunctionData({
          abi: [fn],
          data: calldataOf("uint256", word(5)),
          functionName: "g" as never,
        }),
      ),
    ).toBeInstanceOf(AbiFunctionNameMismatchError);
  });

  test("abiSelector skips hashing but is still checked, and needs one function", () => {
    const fn = fnOf("uint256", undefined);
    const abiSelector = toFunctionSelector("f(uint256)");
    expect(
      decodeFunctionData({ abi: fn, abiSelector, data: calldataOf("uint256", word(5)) }),
    ).toStrictEqual({ functionName: "f", args: [5n] });
    expect(
      errorOf(() => decodeFunctionData({ abi: [fn], abiSelector, data: "0x" } as never)),
    ).toBeInstanceOf(InvalidAbiFunctionError);
  });

  test("overloads that args cannot tell apart are AbiItemAmbiguityError", () => {
    const abi = [
      {
        type: "function",
        name: "f",
        stateMutability: "view",
        inputs: [{ type: "address" }],
        outputs: [{ type: "uint256" }],
      },
      {
        type: "function",
        name: "f",
        stateMutability: "view",
        inputs: [{ type: "bytes20" }],
        outputs: [{ type: "uint256" }],
      },
    ] as const;
    expect(
      errorOf(() =>
        decodeResult({
          abi,
          functionName: "f",
          args: [`0x${ADDRESS}`],
          data: `0x${word(1)}`,
        }),
      ),
    ).toBeInstanceOf(AbiItemAmbiguityError);
  });

  test("an unknown functionName is AbiFunctionNotFoundError", () => {
    expect(
      errorOf(() =>
        decodeResult({
          abi: [fnOf(undefined, "uint256")],
          functionName: "g" as never,
          data: "0x",
        }),
      ),
    ).toBeInstanceOf(AbiFunctionNotFoundError);
  });
});

describe("compiled decoders", () => {
  test("a compiled ABI decoder finds each function by selector; the first of a selector wins", () => {
    const first = fnOf("uint256", undefined);
    const second = { ...first, inputs: [{ name: "z", type: "uint256" }] } as const;
    const decode = compileFunctionDataDecoder({ abi: [first, second, fnOf("uint8", undefined)] });
    const data = calldataOf("uint256", word(5));
    expect(decode(data)).toStrictEqual(decodeFunctionData({ abi: [first, second], data }));
    expect(decode(calldataOf("uint8", word(3)))).toStrictEqual({ functionName: "f", args: [3] });
    expect(decode.abi).toHaveLength(3);
    expect(decode.abiSelector).toBeUndefined();
  });

  test("compiled decoders are detached from later changes to the ABI", () => {
    const fn = {
      type: "function" as const,
      name: "f",
      stateMutability: "view" as const,
      inputs: [{ name: "x", type: "uint256" }],
      outputs: [{ name: "y", type: "uint256" }],
    };
    const abi: unknown[] = [fn];
    const decodeData = compileFunctionDataDecoder({ abi });
    const compiledResult = compileFunctionResultDecoder({ abi: fn });
    fn.inputs[0]!.type = "uint8";
    fn.outputs[0]!.type = "bool";
    abi.push(fnOf("uint8", undefined));
    expect(decodeData(calldataOf("uint256", word(5)))).toStrictEqual({
      functionName: "f",
      args: [5n],
    });
    expect(errorOf(() => decodeData(calldataOf("uint8", word(5))))).toBeInstanceOf(
      AbiFunctionSignatureNotFoundError,
    );
    expect(compiledResult(`0x${word(5)}`)).toBe(5n);
    expect(Object.isFrozen(compiledResult.abi)).toBe(true);
  });

  test("a compiled result decoder resolves the function once, at compilation", () => {
    expect(
      errorOf(() =>
        compileFunctionResultDecoder({
          abi: [fnOf(undefined, "uint256")],
          functionName: "g" as never,
        }),
      ),
    ).toBeInstanceOf(AbiFunctionNotFoundError);
    const decode = compileFunctionResultDecoder({
      abi: [fnOf(undefined, "uint256")],
      functionName: "f",
    });
    expect(decode.functionName).toBe("f");
    expect(decode(`0x${word(7)}`)).toBe(7n);
  });
});

test("every error carries the call: the function, the data and the options", () => {
  const fn = fnOf("uint256", undefined);
  const data = calldataOf("uint256", `${word(5)}${word(0)}`);
  const options = { validatePadding: true };
  const error = errorOf(() => decodeFunctionData({ abi: [fn], data, options }));
  expect(error).toBeInstanceOf(DataTooLongError);
  expect(error).toMatchObject({ abi: fn, data, options });
});
