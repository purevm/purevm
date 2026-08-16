import type { PartialBlocks } from '../call.js';

/**
 * Gets the missing keys from the state
 * @param state - The state
 * @returns The missing keys
 */
export function getMissingKeys(state: PartialBlocks): (keyof PartialBlocks)[] {
    const missing: (keyof PartialBlocks)[] = [];
    
    if (!state.blocks) {  
        missing.push('blocks');
    }
    if (!state.transactions) {
        missing.push('transactions');
    }
    if (!state.logs) {
        missing.push('logs');
    }
    if (!state.traces) {
        missing.push('traces');
    }
    
    return missing;
}