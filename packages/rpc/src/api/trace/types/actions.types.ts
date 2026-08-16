import type { Address, Hex, Quantity } from '@/types/shared.types.js';
import type { TraceCallType, TraceCreateType, TraceRewardType } from "./shared.types.js";

// ============================================================================
// ACTIONS
// ============================================================================

export type TraceCallAction = {
  /** Type of call: "call", "callcode", "delegatecall", or "staticcall" */
  callType: TraceCallType;
  /** Address of the caller */
  from: Address;
  /** Address of the callee */
  to: Address;
  /** Gas provided for the call */
  gas: Quantity;
  /** Input data for the call */
  input: Hex;
  /** Value transferred in the call */
  value: Quantity;
}

export type TraceCreateAction = {
  /** Address of the creator */
  from: Address;
  /** Gas provided for contract creation */
  gas: Quantity;
  /** Contract initialization code */
  init: Hex;
  /** Value sent to the new contract */
  value: Quantity;
  /** Type of creation: "create" or "create2" */
  creationMethod?: TraceCreateType;
}

export type TraceSuicideAction = {
  /** Address of the contract being destroyed */
  address: Address;
  /** Address receiving the remaining balance */
  refundAddress: Address;
  /** Remaining balance transferred to the refund address */
  balance: Quantity;
}

export type TraceRewardAction = {
  /** Type of reward: "block" or "uncle" */
  rewardType: TraceRewardType;
  /** Address receiving the reward */
  author: Address;
  /** Amount of the reward */
  value: Quantity;
}