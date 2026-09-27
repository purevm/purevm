/** Runs at most `concurrency` tasks at once; extra tasks wait in call order. */
export type Limiter = <result>(task: () => Promise<result>) => Promise<result>;

export function createLimiter(concurrency: number): Limiter {
  let active = 0;
  const waiting: (() => void)[] = [];

  return async (task) => {
    if (active < concurrency) active += 1;
    // A finishing task hands its slot over directly, so no newcomer can take it in between.
    else await new Promise<void>((resolve) => waiting.push(resolve));

    try {
      return await task();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active -= 1;
    }
  };
}
