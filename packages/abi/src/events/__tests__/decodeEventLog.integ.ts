/*
 * Integration test: decodes the logs of a real Base transaction (viem issue #3705).
 *
 * Requirements: network access to Base. `BASE_RPC_URL` can select an RPC; otherwise viem uses the
 * public Base endpoint. The test is an integration test because the receipt comes from that real
 * RPC, not from a fake.
 *
 * Run: pnpm test:integ
 */
import { expect, test } from "vitest";
import { env } from "node:process";
// viem is a devDependency: its client fetches the receipt whose logs the port decodes.
import { createClient, http } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { base } from "viem/chains";

import { decodeEventLog } from "../log.decode.ts";

test("https://github.com/wevm/viem/issues/3705", async () => {
  const client = createClient({
    chain: base,
    transport: http(env["BASE_RPC_URL"]),
  });

  const receipt = await waitForTransactionReceipt(client, {
    hash: "0xbee3f576c43a29d3c924cd46ff1ff42489eceae5e8e31afdbba8f982c8291a76",
  });

  const decoded = receipt.logs
    .map((log) => {
      try {
        return decodeEventLog({
          abi: [
            {
              type: "event",
              name: "PetRegistered",
              inputs: [
                {
                  name: "petId",
                  type: "uint256",
                  indexed: true,
                  internalType: "uint256",
                },
                {
                  name: "user",
                  type: "address",
                  indexed: true,
                  internalType: "address",
                },
              ],
              anonymous: false,
            },
          ],
          payload: { topics: log.topics, data: log.data },
          options: { addressFormat: "checksum" },
        });
      } catch {
        return null;
      }
    })
    .filter((log) => log?.eventName === "PetRegistered");

  expect(decoded).toMatchInlineSnapshot(`
    [
      {
        "args": [
          75574n,
          "0x03998b821AB247677a034762CA7F99fACF227975",
        ],
        "eventName": "PetRegistered",
      },
      {
        "args": [
          75575n,
          "0x03998b821AB247677a034762CA7F99fACF227975",
        ],
        "eventName": "PetRegistered",
      },
    ]
  `);
}, 30_000);
