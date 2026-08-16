// ============================================================================
// Shared Types
// ============================================================================

/** The type of call */
export type TraceCallType = 'call' | 'callcode' | 'staticcall' | 'delegatecall';

/** The type of create */
export type TraceCreateType = 'create' | 'create2';

/** The type of reward */
export type TraceRewardType = 'block' | 'uncle';
