import type { Address, Quantity } from "../../types/primitives.js";
import type { RpcTransaction } from "../eth/types.js";

/** Transaction counts returned by `txpool_status`. */
export type TxpoolStatus = {
  /** Transactions ready to be included in the next blocks. */
  pending: Quantity;
  /** Transactions waiting for a nonce gap to close or for more funds. */
  queued: Quantity;
};

/** Entries of one sender keyed by decimal nonce, such as `"42"`. */
export type TxpoolByNonce<entry> = { readonly [nonce: string]: entry };

/** Entries keyed by sender address, then by decimal nonce. */
export type TxpoolBySender<entry> = { readonly [sender: Address]: TxpoolByNonce<entry> };

/** Full pool content returned by `txpool_content`. */
export type TxpoolContent = {
  pending: TxpoolBySender<RpcTransaction>;
  queued: TxpoolBySender<RpcTransaction>;
};

/** Pool content of one sender returned by `txpool_contentFrom`. */
export type TxpoolContentFrom = {
  pending: TxpoolByNonce<RpcTransaction>;
  queued: TxpoolByNonce<RpcTransaction>;
};

/**
 * Human-readable summaries returned by `txpool_inspect`, such as
 * `"0x3b…a4: 1000000000000000000 wei + 21000 gas × 2000000000 wei"`.
 */
export type TxpoolInspect = {
  pending: TxpoolBySender<string>;
  queued: TxpoolBySender<string>;
};
