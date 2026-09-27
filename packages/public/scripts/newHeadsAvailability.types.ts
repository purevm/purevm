import type { BlockNumber } from "../src/index.js";

export type MethodName = "debug_traceBlockByNumber" | "eth_getLogs" | "trace_filter";

export type Availability = {
  afterHeadMs: number;
  afterMintMs: number;
  attempts: number;
  availableAt: string;
  itemCount: number;
  method: MethodName;
};

export type BlockMeasurement = {
  blockHash: string;
  blockNumber: BlockNumber;
  methods: Availability[];
  mintedAt: string;
  receivedAt: string;
  receivedAfterMintMs: number;
};
