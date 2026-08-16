// ===========================================================
// Classes
// ===========================================================

export {
    BlockSourceManager,
    type BlockSource,
    type BlockSourceManagerOptions,
} from "./BlockSourceManager.js";
export { NewHeads, type NewHeadsOptions } from "./NewHeads.js";
export { NewHeadsPolling, type NewHeadsPollingOptions } from "./NewHeadsPolling.js";
export {
    NewHeadsStreaming,
    type NewHeadsStreamingOptions,
} from "./NewHeadsStreaming.js";

// ===========================================================
// Utilities
// ===========================================================

export {
    extractHeaderFromBlock,
    type BlockHeader,
} from "./utils/extractHeaderFromBlock.js";
export {
    ethGetBlockByNumber,
    type RpcBlock,
} from "./api/eth_getBlockByNumber.js";
export type { RpcHead } from "./api/eth_subscribeNewHeads.js";
export type { BlockData } from "./types.js";
