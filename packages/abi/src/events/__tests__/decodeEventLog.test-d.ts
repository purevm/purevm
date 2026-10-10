// Type tests, checked by `pnpm typecheck` (tsc includes every .ts file under src/); vitest does
// not run them.
import { expectTypeOf, test } from "vitest";

import { compileEventLogDecoder } from "../log.compile.ts";
import { decodeEventLog } from "../log.decode.ts";
import type { Abi, AbiParameterToPrimitiveType, Address, Hex } from "../../abi.types.ts";
import type { AnyEventLogDecoder } from "../log.types.ts";

test("named", async () => {
  const event = decodeEventLog({
    abi: [
      {
        inputs: [
          {
            indexed: true,
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            name: "to",
            type: "address",
          },
          {
            indexed: false,
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        inputs: [
          {
            indexed: true,
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            name: "to",
            type: "address",
          },
          {
            indexed: false,
            name: "value",
            type: "uint256",
          },
        ],
        name: "Foo",
        type: "event",
      },
    ],
    eventName: "Transfer",
    payload: {
      data: "0x0000000000000000000000000000000000000000000000000000000000000001",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      ],
    },
  });

  expectTypeOf(event).toEqualTypeOf<{
    args: readonly [Address, Address, bigint];
    eventName: "Transfer";
  }>();
});

test("unnamed", async () => {
  const event = decodeEventLog({
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
    eventName: "Transfer",
    payload: {
      data: "0x0000000000000000000000000000000000000000000000000000000000000001",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      ],
    },
  });

  expectTypeOf(event).toEqualTypeOf<{
    args: readonly [`0x${string}`, `0x${string}`, bigint];
    eventName: "Transfer";
  }>();
});

test("unknown eventName", async () => {
  const event = decodeEventLog({
    abi: [
      {
        inputs: [
          {
            indexed: true,
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            name: "to",
            type: "address",
          },
          {
            indexed: false,
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        inputs: [
          {
            indexed: true,
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            name: "to",
            type: "address",
          },
          {
            indexed: false,
            name: "value",
            type: "uint8",
          },
        ],
        name: "Foo",
        type: "event",
      },
    ],
    payload: {
      data: "0x0000000000000000000000000000000000000000000000000000000000000001",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      ],
    },
  });

  expectTypeOf(event).toEqualTypeOf<
    | {
        eventName: "Transfer";
        args: readonly [Address, Address, bigint];
      }
    | {
        eventName: "Foo";
        args: readonly [Address, Address, number];
      }
  >();
});

test("no abi", async () => {
  const event = decodeEventLog({
    abi: [],
    payload: {
      data: "0x0000000000000000000000000000000000000000000000000000000000000001",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      ],
    },
  });

  expectTypeOf(event).toEqualTypeOf<{
    eventName: string;
    args: readonly unknown[];
  }>();
});

test("defined inline", () => {
  const res = decodeEventLog({
    abi: [
      {
        inputs: [
          {
            indexed: true,
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            name: "to",
            type: "address",
          },
          {
            indexed: false,
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
    ],
    eventName: "Transfer",
    payload: { topics: [] },
  });
  expectTypeOf(res).toEqualTypeOf<{
    eventName: "Transfer";
    args: readonly [`0x${string}`, `0x${string}`, bigint];
  }>();
});

test("declared as Abi", () => {
  const res = decodeEventLog({
    abi: [] as Abi,
    eventName: "Transfer",
    payload: { topics: [] },
  });
  expectTypeOf(res).toEqualTypeOf<{
    args: readonly unknown[] | undefined;
    eventName: "Transfer";
  }>();
});

test("no const assertion", () => {
  const abi = [
    {
      inputs: [
        {
          indexed: true,
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
  ];
  const res = decodeEventLog({
    abi,
    eventName: "Transfer",
    payload: { topics: [] },
  });
  expectTypeOf(res).toEqualTypeOf<{
    args: readonly unknown[] | undefined;
    eventName: "Transfer";
  }>();
});

test("anonymous event topics start at the first indexed argument", () => {
  const anonymous = {
    type: "event",
    name: "Anonymous",
    anonymous: true,
    inputs: [{ indexed: true, name: "owner", type: "address" }],
  } as const;
  const owner = "0x" as Hex;
  const result = decodeEventLog({ abi: anonymous, payload: { topics: [owner] } });
  expectTypeOf(result).toEqualTypeOf<{
    eventName: "Anonymous";
    args: readonly [Address];
  }>();
  // @ts-expect-error Anonymous events do not have an ABI topic0.
  compileEventLogDecoder({ abi: anonymous, abiTopic0: owner });
});

test("compiled decoder preserves the event's result type", () => {
  const event = {
    type: "event",
    name: "Value",
    inputs: [{ indexed: false, name: "value", type: "uint256" }],
  } as const;
  const topic0 = "0x" as Hex;
  const data = "0x" as Hex;
  const decoder = compileEventLogDecoder({ abi: event, abiTopic0: topic0 });
  const registry = new Map<Hex, AnyEventLogDecoder>();
  registry.set(topic0, decoder);
  expectTypeOf(decoder({ topics: [topic0], data })).toEqualTypeOf<{
    eventName: "Value";
    args: readonly [bigint];
  }>();
});

test("a compiled ABI decoder has the result type of decodeEventLog with that ABI", () => {
  const abi = [
    { type: "constructor", inputs: [], stateMutability: "nonpayable" },
    {
      type: "event",
      name: "Transfer",
      inputs: [
        { indexed: true, name: "from", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
    },
    { type: "event", name: "Paused", inputs: [] },
  ] as const;
  const topics = ["0x", "0x"] as const satisfies readonly Hex[];
  const data = "0x" as Hex;
  const decoder = compileEventLogDecoder({ abi });
  expectTypeOf(decoder({ topics, data })).toEqualTypeOf(
    decodeEventLog({ abi, payload: { topics, data } }),
  );
  expectTypeOf(decoder.abiTopic0).toEqualTypeOf<undefined>();
  // @ts-expect-error An ABI has no single topic0.
  compileEventLogDecoder({ abi, abiTopic0: "0x" });
});

test("function is not advertised as a decoded primitive", () => {
  expectTypeOf<AbiParameterToPrimitiveType<{ type: "function" }>>().toEqualTypeOf<unknown>();
});
