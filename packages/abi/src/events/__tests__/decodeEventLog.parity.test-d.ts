// Type-level value parity with viem. The package returns the arguments by position instead of
// viem's named object, so corresponding values are compared individually; tuples are objects when
// all their components are named, like viem's.
import { expectTypeOf, test } from "vitest";
import { decodeEventLog as viemDecodeEventLog, type Abi as ViemAbi, type Hex } from "viem";

import { decodeEventLog } from "../log.decode.ts";
import type { Abi, Address } from "../../abi.types.ts";

const abi = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "transfer",
    inputs: [{ name: "to", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  { type: "fallback", stateMutability: "payable" },
  { type: "receive", stateMutability: "payable" },
  { type: "error", name: "Denied", inputs: [{ name: "who", type: "address" }] },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Order",
    inputs: [
      { indexed: true, name: "id", type: "uint64" },
      {
        indexed: false,
        name: "legs",
        type: "tuple[]",
        components: [
          { name: "side", type: "uint8" },
          { name: "memo", type: "string" },
        ],
      },
      { indexed: false, name: "grid", type: "int16[2][3]" },
    ],
  },
  {
    type: "event",
    name: "Unnamed",
    inputs: [
      { indexed: true, name: "", type: "address" },
      { indexed: false, name: "", type: "bytes32" },
      { indexed: false, name: "", type: "bool" },
    ],
  },
  { type: "event", name: "Paused", inputs: [] },
] as const;

declare const t0: Hex;
declare const t1: Hex;
declare const t2: Hex;
declare const data: Hex;

test("named values match viem and remain positional", () => {
  const decoded = decodeEventLog({
    abi,
    eventName: "Transfer",
    payload: { topics: [t0, t1, t2], data },
  });
  const viemDecoded = viemDecodeEventLog({
    abi,
    eventName: "Transfer",
    topics: [t0, t1, t2],
    data,
  });

  expectTypeOf(decoded).toEqualTypeOf<{
    eventName: "Transfer";
    args: readonly [Address, Address, bigint];
  }>();
  expectTypeOf(decoded.args[0]).toEqualTypeOf(viemDecoded.args.from);
  expectTypeOf(decoded.args[1]).toEqualTypeOf(viemDecoded.args.to);
  expectTypeOf(decoded.args[2]).toEqualTypeOf(viemDecoded.args.value);
});

test("nested tuples and fixed arrays have viem's types", () => {
  const decoded = decodeEventLog({
    abi,
    eventName: "Order",
    payload: { topics: [t0, t1], data },
  });
  const viemDecoded = viemDecodeEventLog({
    abi,
    eventName: "Order",
    topics: [t0, t1],
    data,
  });

  expectTypeOf(decoded).toEqualTypeOf<{
    eventName: "Order";
    args: readonly [
      bigint,
      readonly { side: number; memo: string }[],
      readonly [readonly [number, number], readonly [number, number], readonly [number, number]],
    ];
  }>();
  expectTypeOf(decoded.args[0]).toEqualTypeOf(viemDecoded.args.id);
  expectTypeOf(decoded.args[1]).toEqualTypeOf(viemDecoded.args.legs);
  expectTypeOf(decoded.args[2]).toEqualTypeOf(viemDecoded.args.grid);
});

test("unnamed parameters match viem's positional result", () => {
  const decoded = decodeEventLog({
    abi,
    eventName: "Unnamed",
    payload: { topics: [t0, t1], data },
  });
  const viemDecoded = viemDecodeEventLog({
    abi,
    eventName: "Unnamed",
    topics: [t0, t1],
    data,
  });

  expectTypeOf(decoded).toEqualTypeOf(viemDecoded);
});

test("one event has the same value types as the ABI containing it", () => {
  const transfer = abi[5];
  const decoded = decodeEventLog({
    abi: transfer,
    payload: { topics: [t0, t1, t2], data },
  });
  const viemDecoded = viemDecodeEventLog({ abi: [transfer], topics: [t0, t1, t2], data });

  expectTypeOf(decoded.args[0]).toEqualTypeOf(viemDecoded.args.from);
  expectTypeOf(decoded.args[1]).toEqualTypeOf(viemDecoded.args.to);
  expectTypeOf(decoded.args[2]).toEqualTypeOf(viemDecoded.args.value);
});

test("an event without inputs has no decoded arguments", () => {
  expectTypeOf(
    decodeEventLog({ abi, eventName: "Paused", payload: { topics: [t0] } }),
  ).toEqualTypeOf<{
    eventName: "Paused";
    args?: undefined;
  }>();
});

test("a wide Abi keeps the safe fallback", () => {
  const wide: Abi = abi;
  const viemWide: ViemAbi = abi;
  const decoded = decodeEventLog({ abi: wide, payload: { topics: [t0], data } });
  viemDecodeEventLog({ abi: viemWide, topics: [t0], data });

  expectTypeOf(decoded).toEqualTypeOf<{
    eventName: string;
    args: readonly unknown[] | undefined;
  }>();
});

test("an ABI without const assertion keeps the safe fallback", () => {
  const loose = [
    {
      type: "event",
      name: "Transfer",
      inputs: [{ indexed: true, name: "from", type: "address" }],
    },
  ];
  expectTypeOf(decodeEventLog({ abi: loose, payload: { topics: [t0, t1] } })).toEqualTypeOf<{
    eventName: string;
    args: readonly unknown[] | undefined;
  }>();
});
