import { loadEnvFile } from "node:process";

import { ethGetBlockByTag } from "../src/actions/eth/ethGetBlockByTag.js";
import { traceFilter } from "../src/actions/trace/traceFilter.js";
import { HttpTransport } from "../src/index.js";

loadEnvFile(new URL("../../../.env", import.meta.url));

const url = process.env["BASE_HTTP_URL"];
if (!url) throw new Error("BASE_HTTP_URL is required in the monorepo root .env file");

const timeoutMs = parsePositiveInteger(process.env["PUREVM_TIMEOUT_MS"] ?? "120000");
const transport = new HttpTransport({ url });
const finalizedBlock = await ethGetBlockByTag(transport, { blockTag: "finalized" }, { timeoutMs });
if (!finalizedBlock?.number) throw new Error("Finalized block has no block number");

const traces = await traceFilter(
  transport,
  {
    count: 10_000,
    fromBlock: finalizedBlock.number,
    toBlock: finalizedBlock.number,
  },
  { timeoutMs },
);

const blockNumbers = new Set<number>();
const transactionHashes = new Set<string>();

for (const trace of traces) {
  if (!Number.isSafeInteger(trace.blockNumber) || trace.blockNumber < 0) {
    throw new Error(`Invalid trace block number: ${trace.blockNumber}`);
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(trace.blockHash)) {
    throw new Error(`Invalid trace block hash: ${trace.blockHash}`);
  }

  blockNumbers.add(trace.blockNumber);
  if (trace.type !== "reward") transactionHashes.add(trace.transactionHash.toLowerCase());
}

process.stdout.write(
  `${JSON.stringify(
    {
      blockNumbers: [...blockNumbers].toSorted((left, right) => left - right),
      blockNumber: finalizedBlock.number,
      blockTag: "finalized",
      rpcMethod: "trace_filter",
      rpcOrigin: new URL(url).origin,
      traceCount: traces.length,
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
