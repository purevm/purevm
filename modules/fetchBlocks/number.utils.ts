import { FetchBlocksDataError } from "./FetchBlocksDataError.js";

export function assertPositiveSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new FetchBlocksDataError(`${label} must be a positive safe integer`);
  }
}
