import {
  createHttpClient,
  type BlockHash,
  type BlockNumber,
  type BlockTag,
  type HttpClient,
  type HttpRequestOptions,
} from "@purevm/public";

import { getBlockByTag } from "../block/getBlockByTag.js";
import { ExtensionDataError } from "../errors/index.js";

const BLOCK_TAGS = new Set<BlockTag>(["earliest", "finalized", "latest", "pending", "safe"]);
const TRANSACTION_HASH_PATTERN = /^0x[\dA-Fa-f]{64}$/;

export type InspectionContext = {
  blockHash: BlockHash;
  blockNumber: BlockNumber;
  blockTag: BlockTag;
  client: HttpClient;
  options: HttpRequestOptions;
};

export async function createInspectionContext(): Promise<InspectionContext> {
  const blockTag = parseBlockTag(process.env["PUREVM_BLOCK_TAG"]);
  const timeoutMs = parsePositiveInteger(process.env["PUREVM_TIMEOUT_MS"], 30_000);
  const client = createHttpClient({
    retry: { retries: 1 },
    timeoutMs,
    url: process.env["PUREVM_RPC_URL"] ?? "https://ethereum-rpc.publicnode.com",
  });
  const options: HttpRequestOptions = { timeoutMs };
  const { block } = await getBlockByTag(client, blockTag, options);

  if (!block.hash || !block.number) {
    throw new ExtensionDataError(`Block ${blockTag} has no stable hash or number`);
  }

  return { blockHash: block.hash, blockNumber: block.number, blockTag, client, options };
}

export async function inspectExtension(name: string, load: () => Promise<unknown>): Promise<void> {
  try {
    const result = await load();
    write({
      name,
      result: preserveExactValues(result),
      shape: describeShape(result),
      status: "ok",
    });
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    write({
      error: { message: cause.message, name: cause.name },
      name,
      status: "error",
    });
    process.exitCode = 1;
  }
}

export function runInspectionScript(main: () => Promise<void>): void {
  void main().catch((error: unknown) => {
    const cause = error instanceof Error ? error : new Error(String(error));
    write({
      error: { message: cause.message, name: cause.name },
      name: "inspection",
      status: "error",
    });
    process.exitCode = 1;
  });
}

function parseBlockTag(value: string | undefined): BlockTag {
  if (!value) return "latest";
  if (BLOCK_TAGS.has(value as BlockTag)) return value as BlockTag;
  throw new TypeError(`PUREVM_BLOCK_TAG must be one of: ${[...BLOCK_TAGS].join(", ")}`);
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new TypeError("PUREVM_TIMEOUT_MS must be a positive integer");
  }
  return parsed;
}

function preserveExactValues(value: unknown): unknown {
  if (value === undefined) return { $exact: "undefined" };
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(preserveExactValues);

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, preserveExactValues(child)]),
  );
}

function describeShape(value: unknown): unknown {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return {
      length: value.length,
      type: "array",
      variants: uniqueShapes(value.map(describeShape)),
    };
  }
  if (typeof value !== "object") return describePrimitive(value);

  const entries = Object.entries(value);
  if (entries.length > 0 && entries.every(([key]) => TRANSACTION_HASH_PATTERN.test(key))) {
    return {
      entries: entries.length,
      key: "transaction-hash",
      type: "record",
      variants: uniqueShapes(entries.map(([, child]) => describeShape(child))),
    };
  }

  return {
    fields: Object.fromEntries(entries.map(([key, child]) => [key, describeShape(child)])),
    type: "object",
  };
}

function describePrimitive(value: unknown): unknown {
  if (typeof value === "function") return { type: "function" };
  if (typeof value !== "string") return { type: typeof value, value };
  if (value === "" || value === "0x" || value === "0x0") {
    return { exact: value, type: "string" };
  }
  if (/^0x[\dA-Fa-f]{40}$/.test(value)) return { format: "address", type: "string" };
  if (TRANSACTION_HASH_PATTERN.test(value)) return { format: "32-byte-hash", type: "string" };
  if (/^0x[\dA-Fa-f]+$/.test(value)) return { format: "hex", type: "string" };
  return { type: "string", value };
}

function uniqueShapes(shapes: unknown[]): unknown[] {
  const unique = new Map<string, unknown>();
  for (const shape of shapes) unique.set(JSON.stringify(shape), shape);
  return [...unique.values()];
}

function write(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
