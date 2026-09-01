export function getTracePathKey(path: readonly number[]): string {
  return path.join(".");
}

export function getEffectiveTraceError(
  path: readonly number[],
  errors: ReadonlyMap<string, string>,
): string | null {
  for (let length = path.length; length >= 0; length--) {
    const error = errors.get(getTracePathKey(path.slice(0, length)));
    if (error) return error;
  }

  return null;
}
