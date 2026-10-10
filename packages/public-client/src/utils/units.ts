const DECIMAL = /^-?(?:\d+\.?\d*|\.\d+)$/;

function assertDecimals(decimals: number): void {
  if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new RangeError("decimals must be an integer between 0 and 255.");
  }
}

/** Formats an integer amount of base units as a decimal string, such as `1.5` for 1.5 ether. */
export function formatUnits(value: bigint, decimals: number): string {
  assertDecimals(decimals);
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

/**
 * Parses a decimal string into an integer amount of base units. The conversion is exact: a value
 * with more fractional digits than `decimals` is rejected instead of rounded.
 */
export function parseUnits(value: string, decimals: number): bigint {
  assertDecimals(decimals);
  if (!DECIMAL.test(value)) throw new TypeError(`Invalid decimal number: ${value}`);
  const negative = value.startsWith("-");
  const [whole = "", fraction = ""] = (negative ? value.slice(1) : value).split(".");
  if (fraction.length > decimals) {
    throw new RangeError(`${value} has more than ${decimals} fractional digits.`);
  }
  const units = BigInt(`${whole || "0"}${fraction.padEnd(decimals, "0")}`);
  return negative ? -units : units;
}

/** Formats wei as ether. */
export function formatEther(wei: bigint): string {
  return formatUnits(wei, 18);
}

/** Parses ether into wei. */
export function parseEther(ether: string): bigint {
  return parseUnits(ether, 18);
}

/** Formats wei as gwei. */
export function formatGwei(wei: bigint): string {
  return formatUnits(wei, 9);
}

/** Parses gwei into wei. */
export function parseGwei(gwei: string): bigint {
  return parseUnits(gwei, 9);
}
