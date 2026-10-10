import { expect, test } from "vitest";
import {
  formatEventDefinition,
  hashEventDefinition,
  normalizeEventDefinition,
  type AbiEvent,
} from "../../index.ts";

const swap = (lastName: string): AbiEvent => ({
  type: "event",
  name: "Swap",
  inputs: [
    { name: "from", type: "address", indexed: true },
    { name: "to", type: "address", indexed: true },
    { name: "amount", type: "uint256" },
    { name: lastName, type: "uint256" },
  ],
});

test("parameter names distinguish otherwise identical event definitions", () => {
  expect(hashEventDefinition(swap("value"))).not.toBe(hashEventDefinition(swap("fee")));
});

test("canonical aliases share a definition and normalized ABI", () => {
  const aliased = {
    type: "event",
    name: "Example",
    inputs: [
      { name: "amounts", type: "uint[]", indexed: false, internalType: "uint256[]" },
      {
        name: "item",
        type: "tuple",
        components: [{ name: "value", type: "byte" }],
      },
    ],
  } as const satisfies AbiEvent;
  const canonical = {
    type: "event",
    name: "Example",
    anonymous: false,
    inputs: [
      { name: "amounts", type: "uint256[]", indexed: false },
      {
        name: "item",
        type: "tuple",
        indexed: false,
        components: [{ name: "value", type: "bytes1" }],
      },
    ],
  } as const satisfies AbiEvent;

  expect(formatEventDefinition(aliased)).toBe("Example(uint256[] amounts,(bytes1 value) item)");
  expect(hashEventDefinition(aliased)).toBe(hashEventDefinition(canonical));
  expect(normalizeEventDefinition(aliased)).toEqual(canonical);
});
