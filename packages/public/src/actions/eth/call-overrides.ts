import type { BlockOverrides, RpcCallRequest, StateOverride } from "./types.js";

/** Positional call parameters. Overrides are appended only when provided. */
export type CallParams<block> =
  | readonly [RpcCallRequest, block]
  | readonly [RpcCallRequest, block, StateOverride]
  | readonly [RpcCallRequest, block, StateOverride, BlockOverrides];

export function toCallParams<block>(
  call: RpcCallRequest,
  block: block,
  stateOverrides: StateOverride | undefined,
  blockOverrides?: BlockOverrides | undefined,
): CallParams<block> {
  // Block overrides are the fourth parameter, so an empty state override keeps its position.
  if (blockOverrides !== undefined) return [call, block, stateOverrides ?? {}, blockOverrides];
  if (stateOverrides !== undefined) return [call, block, stateOverrides];
  return [call, block];
}
