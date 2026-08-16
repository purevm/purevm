import type { RpcBlock } from './api/eth_getBlockByNumber.js';
import type { RpcHead } from './api/eth_subscribeNewHeads.js';

/**
 * The source of the block (polling or streaming).
 */
export type HeadSource = "ws" | "poll";

/**
 * The block data type (polling or streaming).
 */
export type BlockData = RpcBlock | RpcHead;