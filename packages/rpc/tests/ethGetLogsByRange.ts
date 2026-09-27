import { loadEnvFile } from "node:process";

import { ethGetLogsByRange } from "../src/actions/eth/ethGetLogsByRange.js";
import { HttpTransport } from "../src/index.js";

loadEnvFile(new URL("../../../.env", import.meta.url));

const url = process.env["BASE_HTTP_URL"];
if (!url) throw new Error("BASE_HTTP_URL is required in the monorepo root .env file");

const timeoutMs = parsePositiveInteger(process.env["PUREVM_TIMEOUT_MS"] ?? "120000");
const transport = new HttpTransport({ url });
const logs = await ethGetLogsByRange(
  transport,
  {
    fromBlock: "finalized",
    toBlock: "finalized",
  },
  { timeoutMs },
);

const blockHashes = new Set<string>();
const transactionHashes = new Set<string>();

for (const log of logs) {
  if (!log.blockHash || !/^0x[0-9a-fA-F]{64}$/.test(log.blockHash)) {
    throw new Error(`Invalid log block hash: ${log.blockHash}`);
  }
  if (!log.blockNumber) throw new Error("Finalized log is missing its block number");
  if (!log.transactionHash || !/^0x[0-9a-fA-F]{64}$/.test(log.transactionHash)) {
    throw new Error(`Invalid log transaction hash: ${log.transactionHash}`);
  }
  if (!log.transactionIndex) throw new Error("Finalized log is missing its transaction index");
  if (!log.logIndex) throw new Error("Finalized log is missing its log index");

  blockHashes.add(log.blockHash.toLowerCase());
  transactionHashes.add(log.transactionHash.toLowerCase());
}

process.stdout.write(
  `${JSON.stringify(
    {
      blockCount: blockHashes.size,
      blockTag: "finalized",
      logCount: logs.length,
      rpcMethod: "eth_getLogs",
      rpcOrigin: new URL(url).origin,
      transactionCount: transactionHashes.size,
    },
    null,
    2,
  )}\n`,
);

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`PUREVM_TIMEOUT_MS must be a positive safe integer, received ${value}`);
  }
  return parsed;
}
