import { expect, expectTypeOf, test } from "vitest";

import { createHttpClient, type HttpClient } from "../../../clients/http-client.js";
import type { EthCallByTagParameters } from "../ethCallByTag.js";
import type { EthEstimateGasByNumberParameters } from "../ethEstimateGasByNumber.js";
import type { EthEstimateGasByTagParameters } from "../ethEstimateGasByTag.js";

const hash = `0x${"1".repeat(64)}` as const;
const address = `0x${"2".repeat(40)}` as const;
const call = { data: "0x70a08231", to: address } as const;
const stateOverrides = {
  [address]: { balance: "0xde0b6b3a7640000", code: "0x6001", stateDiff: { "0x0": "0x1" } },
} as const;
const blockOverrides = { baseFeePerGas: "0x0", number: "0x20", time: "0x64" } as const;

function recordingClient(): { client: HttpClient; sent: { method: string; params: unknown }[] } {
  const sent: { method: string; params: unknown }[] = [];
  const client = createHttpClient({
    url: "https://rpc.example.com",
    retry: false,
    fetch: async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as {
        id: number;
        method: string;
        params: unknown;
      };
      sent.push({ method: request.method, params: request.params });
      return Response.json({ id: request.id, jsonrpc: "2.0", result: "0x" });
    },
  });
  return { client, sent };
}

test("eth_call omits overrides that are not provided", async () => {
  const { client, sent } = recordingClient();

  await client.ethCallByTag({ blockTag: "latest", call });

  expect(sent).toEqual([{ method: "eth_call", params: [call, "latest"] }]);
});

test("eth_call appends state overrides", async () => {
  const { client, sent } = recordingClient();

  await client.ethCallByNumber({ blockNumber: "0x10", call, stateOverrides });

  expect(sent).toEqual([{ method: "eth_call", params: [call, "0x10", stateOverrides] }]);
});

test("eth_call keeps block overrides in fourth position", async () => {
  const { client, sent } = recordingClient();

  await client.ethCallByTag({ blockOverrides, blockTag: "latest", call });
  await client.ethCallByHash({ blockHash: hash, blockOverrides, call, stateOverrides });

  expect(sent).toEqual([
    { method: "eth_call", params: [call, "latest", {}, blockOverrides] },
    {
      method: "eth_call",
      params: [call, { blockHash: hash }, stateOverrides, blockOverrides],
    },
  ]);
});

test("eth_estimateGas appends state overrides", async () => {
  const { client, sent } = recordingClient();

  await client.ethEstimateGasByTag({ blockTag: "pending", call, stateOverrides });
  await client.ethEstimateGasByNumber({ blockNumber: "0x10", call });

  expect(sent).toEqual([
    { method: "eth_estimateGas", params: [call, "pending", stateOverrides] },
    { method: "eth_estimateGas", params: [call, "0x10"] },
  ]);
});

test("eth_estimateGas does not accept block overrides", () => {
  expectTypeOf<EthEstimateGasByTagParameters>().not.toHaveProperty("blockOverrides");
  expectTypeOf<EthEstimateGasByNumberParameters>().not.toHaveProperty("blockOverrides");
  expectTypeOf<EthCallByTagParameters>().toHaveProperty("blockOverrides");
});
