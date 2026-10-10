/* Generic type utilities of viem@2.56.9 (`src/types/utils.ts`). */
import type { Prettify } from "./abi.types.ts";

export type UnionEvaluate<type> = type extends object ? Prettify<type> : type;

/**
 * @description Checks if {@link T} can be narrowed further than {@link U}
 * @example
 * type Result = IsNarrowable<'foo', string>
 * //   ^? true
 */
export type IsNarrowable<T, U> = [
  (T extends U ? true : false) & (U extends T ? false : true),
] extends [never]
  ? false
  : true;

export type IsUnion<union, union2 = union> = union extends union2
  ? [union2] extends [union]
    ? false
    : true
  : never;

export type UnionToTuple<union, last = LastInUnion<union>> = [union] extends [never]
  ? []
  : [...UnionToTuple<Exclude<union, last>>, last];

type LastInUnion<U> =
  UnionToIntersection<U extends unknown ? (x: U) => 0 : never> extends (x: infer l) => 0
    ? l
    : never;

type UnionToIntersection<union> = (union extends unknown ? (arg: union) => 0 : never) extends (
  arg: infer i,
) => 0
  ? i
  : never;
