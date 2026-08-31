export function createRequestIdGenerator(): () => number {
  let id = 0;

  return () => {
    id = id >= Number.MAX_SAFE_INTEGER ? 1 : id + 1;
    return id;
  };
}
