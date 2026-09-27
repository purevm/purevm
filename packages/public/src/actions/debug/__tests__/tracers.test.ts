import { expect, expectTypeOf, test } from "vitest";

import { createHttpClient, type HttpClient } from "../../../clients/http-client.js";
import type { TraceEntry } from "../../trace/types.js";
import type {
  DebugBlockTrace,
  DebugCallFrame,
  DebugFourByteResult,
  DebugPrestate,
  DebugPrestateDiff,
  DebugStructLogResult,
} from "../types.js";

const hash = `0x${"1".repeat(64)}` as const;
const address = `0x${"2".repeat(40)}` as const;
const call = { data: "0x", from: address, to: address } as const;

function recordingClient(): { client: HttpClient; params: () => unknown[] } {
  const sent: unknown[] = [];
  const client = createHttpClient({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as { id: number; params?: unknown };
      sent.push(request.params);
      return Response.json({ id: request.id, jsonrpc: "2.0", result: null });
    },
  });
  return { client, params: () => sent };
}

test.for([
  [{ tracer: "callTracer", tracerConfig: { onlyTopCall: true, withLog: true } }],
  [{ tracer: "flatCallTracer", tracerConfig: { convertParityErrors: true } }],
  [{ tracer: "prestateTracer", tracerConfig: { diffMode: true, disableCode: true } }],
  [{ tracer: "4byteTracer" }],
  [{ tracer: "noopTracer" }],
  [{ tracer: "muxTracer", tracerConfig: { "4byteTracer": {}, callTracer: { onlyTopCall: true } } }],
  [{ enableMemory: true, limit: 100 }],
  [{ timeout: "5s", tracer: "{ result: function () { return 1; }, fault: function () {} }" }],
] as const)("forwards tracer configuration %o unchanged", async ([config]) => {
  const { client, params } = recordingClient();

  await client.debugTraceTransaction(hash, config);
  await client.debugTraceBlockByNumber("0x10", config);

  expect(params()).toEqual([
    [hash, config],
    ["0x10", config],
  ]);
});

test("forwards debug_traceCall state and block overrides", async () => {
  const { client, params } = recordingClient();
  const config = {
    blockOverrides: { number: "0x20", time: "0x1" },
    stateOverrides: { [address]: { balance: "0xde0b6b3a7640000", stateDiff: { "0x0": "0x1" } } },
    tracer: "prestateTracer",
  } as const;

  await client.debugTraceCallByTag(call, "latest", config);

  expect(params()).toEqual([[call, "latest", config]]);
});

test("defaults to callTracer", async () => {
  const { client, params } = recordingClient();

  await client.debugTraceCallByHash(call, hash);

  expect(params()).toEqual([[call, hash, { tracer: "callTracer" }]]);
});

test("infers the result type from the tracer", () => {
  const client = createHttpClient({ url: "https://rpc.example.com" });

  expectTypeOf(client.debugTraceTransaction(hash)).resolves.toEqualTypeOf<DebugCallFrame>();
  expectTypeOf(
    client.debugTraceTransaction(hash, { tracer: "flatCallTracer" }),
  ).resolves.toEqualTypeOf<TraceEntry[]>();
  expectTypeOf(
    client.debugTraceTransaction(hash, { tracer: "prestateTracer" }),
  ).resolves.toEqualTypeOf<DebugPrestate>();
  expectTypeOf(
    client.debugTraceTransaction(hash, {
      tracer: "prestateTracer",
      tracerConfig: { diffMode: true },
    }),
  ).resolves.toEqualTypeOf<DebugPrestateDiff>();
  expectTypeOf(
    client.debugTraceTransaction(hash, { tracer: "4byteTracer" }),
  ).resolves.toEqualTypeOf<DebugFourByteResult>();
  expectTypeOf(client.debugTraceTransaction(hash, { tracer: "noopTracer" })).resolves.toEqualTypeOf<
    Record<string, never>
  >();
  expectTypeOf(
    client.debugTraceTransaction(hash, { enableMemory: true }),
  ).resolves.toEqualTypeOf<DebugStructLogResult>();
  expectTypeOf(
    client.debugTraceTransaction(hash, { tracer: "{ result() { return 1; }, fault() {} }" }),
  ).resolves.toBeUnknown();
  expectTypeOf(
    client.debugTraceTransaction(hash, {
      tracer: "muxTracer",
      tracerConfig: { callTracer: {}, prestateTracer: { diffMode: true } },
    }),
  ).resolves.toEqualTypeOf<{ callTracer: DebugCallFrame; prestateTracer: DebugPrestateDiff }>();
  expectTypeOf(
    client.debugTraceBlockByTag("latest", { tracer: "prestateTracer" }),
  ).resolves.toEqualTypeOf<DebugBlockTrace<DebugPrestate>[]>();
  expectTypeOf(
    client.debugTraceCallByNumber(call, "0x10", { tracer: "4byteTracer" }),
  ).resolves.toEqualTypeOf<DebugFourByteResult>();
});

test("exposes tracer failures of block traces", () => {
  const trace = {} as DebugBlockTrace;

  if (trace.result === undefined) expectTypeOf(trace.error).toBeString();
  else expectTypeOf(trace.result).toEqualTypeOf<DebugCallFrame>();
});
