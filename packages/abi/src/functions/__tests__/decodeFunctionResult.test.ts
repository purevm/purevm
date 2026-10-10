import { expect, test } from "vitest";

import { decodeFunctionResult } from "../function.result.ts";
import type { DecodeFunctionOptions } from "../function.types.ts";

// viem's own tests: every strict check off, so that the decoder behaves exactly like viem.
const VIEM: DecodeFunctionOptions = {
  addressFormat: "checksum",
  validateHex: false,
  validateTypes: false,
  validateSelectorSize: false,
  validateDataAlignment: false,
  validateDataLength: false,
  validateCanonicalOffsets: false,
  validatePadding: false,
};

test("returns ()", () => {
  expect(
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [],
          name: "foo",
          outputs: [],
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "foo",
      data: "0x",
    }),
  ).toEqual(undefined);
  expect(
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [],
          name: "foo",
          outputs: [],
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "foo",
      // @ts-expect-error
      data: "",
    }),
  ).toEqual(undefined);
});

test("returns (address)", () => {
  expect(
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [],
          name: "foo",
          outputs: [
            {
              name: "sender",
              type: "address",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "foo",
      data: "0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac",
    }),
  ).toEqual("0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC");
});

test("returns (Bar)", () => {
  expect(
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [],
          name: "bar",
          outputs: [
            {
              components: [
                {
                  components: [
                    {
                      name: "sender",
                      type: "address",
                    },
                    {
                      name: "x",
                      type: "uint256",
                    },
                    {
                      name: "y",
                      type: "bool",
                    },
                  ],
                  name: "foo",
                  type: "tuple",
                },
                {
                  name: "sender",
                  type: "address",
                },
                {
                  name: "z",
                  type: "uint32",
                },
              ],
              name: "res",
              type: "tuple",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "bar",
      data: "0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac0000000000000000000000000000000000000000000000000000000000010f2c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac0000000000000000000000000000000000000000000000000000000000000045",
    }),
  ).toEqual({
    foo: {
      sender: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
      x: 69420n,
      y: true,
    },
    sender: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
    z: 69,
  });
});

test("returns (Bar, string)", () => {
  expect(
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [],
          name: "baz",
          outputs: [
            {
              components: [
                {
                  components: [
                    {
                      name: "sender",
                      type: "address",
                    },
                    {
                      name: "x",
                      type: "uint256",
                    },
                    {
                      name: "y",
                      type: "bool",
                    },
                  ],
                  name: "foo",
                  type: "tuple",
                },
                {
                  name: "sender",
                  type: "address",
                },
                {
                  name: "z",
                  type: "uint32",
                },
              ],
              name: "res",
              type: "tuple",
            },
            {
              name: "bob",
              type: "string",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "baz",
      data: "0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac0000000000000000000000000000000000000000000000000000000000010f2c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac000000000000000000000000000000000000000000000000000000000000004500000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000",
    }),
  ).toEqual([
    {
      foo: {
        sender: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
        x: 69420n,
        y: true,
      },
      sender: "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC",
      z: 69,
    },
    "wagmi",
  ]);
});

test("overloads", () => {
  expect(
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          name: "foo",
          outputs: [
            {
              name: "x",
              type: "uint256",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
        {
          inputs: [],
          name: "foo",
          outputs: [
            {
              name: "sender",
              type: "address",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "foo",
      data: "0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac",
    }),
  ).toEqual("0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC");

  expect(
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          name: "foo",
          outputs: [
            {
              name: "x",
              type: "uint256",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
        {
          inputs: [],
          name: "foo",
          outputs: [
            {
              name: "sender",
              type: "address",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "foo",
      data: "0x0000000000000000000000000000000000000000000000000000000000000069",
      args: [10n],
    }),
  ).toEqual(105n);
});

test("inferred functionName", () => {
  expect(
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [],
          name: "foo",
          outputs: [
            {
              name: "sender",
              type: "address",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      data: "0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac",
    }),
  ).toEqual("0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC");
});

test("error: function doesn't exist", () => {
  expect(() =>
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [],
          name: "foo",
          outputs: [
            {
              name: "sender",
              type: "address",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      // @ts-expect-error
      functionName: "baz",
      data: "0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac",
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiFunctionNotFoundError: Function "baz" not found on ABI.
    Make sure you are using the correct ABI and that the function exists on it.]
  `,
  );
});

test("error: abi item not a function", () => {
  expect(() =>
    // @ts-expect-error
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [
            {
              indexed: true,
              type: "address",
            },
            {
              indexed: true,
              type: "address",
            },
            {
              indexed: false,
              type: "uint256",
            },
          ],
          name: "Transfer",
          type: "event",
        },
      ],
      data: "0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac",
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiFunctionNotFoundError: Function not found on ABI.
    Make sure you are using the correct ABI and that the function exists on it.]
  `,
  );
});

test("error: no outputs", () => {
  expect(() =>
    decodeFunctionResult({
      options: VIEM,
      abi: [
        {
          inputs: [],
          name: "foo",
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "foo",
      data: "0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac",
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiFunctionOutputsNotFoundError: Function "foo" does not contain any \`outputs\` on ABI.
    Cannot decode function result without knowing what the parameter types are.
    Make sure you are using the correct ABI and that the function exists on it.]
  `,
  );
});
