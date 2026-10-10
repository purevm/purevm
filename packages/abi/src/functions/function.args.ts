/*
 * Type-level inference of function names, arguments and return values, from viem@2.56.9
 * (`src/types/contract.ts`).
 */
import type {
  Abi,
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  AbiStateMutability,
  Address,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
  Hex,
} from "../abi.types.ts";
import type { IsUnion, UnionToTuple } from "../types.utils.ts";

export type ContractFunctionName<
  abi extends Abi | readonly unknown[] = Abi,
  mutability extends AbiStateMutability = AbiStateMutability,
> =
  ExtractAbiFunctionNames<
    abi extends Abi ? abi : Abi,
    mutability
  > extends infer functionName extends string
    ? [functionName] extends [never]
      ? string
      : functionName
    : string;

export type ContractFunctionArgs<
  abi extends Abi | readonly unknown[] = Abi,
  mutability extends AbiStateMutability = AbiStateMutability,
  functionName extends ContractFunctionName<abi, mutability> = ContractFunctionName<
    abi,
    mutability
  >,
> =
  AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<abi extends Abi ? abi : Abi, functionName, mutability>["inputs"]
  > extends infer args
    ? [args] extends [never]
      ? readonly unknown[]
      : args
    : readonly unknown[];

/** The overloads of `functionName` whose inputs accept `args`. */
export type ExtractAbiFunctionForArgs<
  abi extends Abi,
  mutability extends AbiStateMutability,
  functionName extends ContractFunctionName<abi, mutability>,
  args extends ContractFunctionArgs<abi, mutability, functionName>,
> =
  ExtractAbiFunction<abi, functionName, mutability> extends infer abiFunction extends AbiFunction
    ? IsUnion<abiFunction> extends true
      ? UnionToTuple<abiFunction> extends infer abiFunctions extends readonly AbiFunction[]
        ? { [k in keyof abiFunctions]: CheckArgs<abiFunctions[k], args> }[number]
        : never
      : abiFunction
    : never;

type CheckArgs<
  abiFunction extends AbiFunction,
  args,
  targetArgs extends AbiParametersToPrimitiveTypes<abiFunction["inputs"]> =
    AbiParametersToPrimitiveTypes<abiFunction["inputs"]>,
> = (readonly [] extends args ? readonly [] : args) extends targetArgs ? abiFunction : never;

/** No output: `void`; one: its value; several: a tuple of them. */
export type ContractFunctionReturnType<
  abi extends Abi | readonly unknown[] = Abi,
  mutability extends AbiStateMutability = AbiStateMutability,
  functionName extends ContractFunctionName<abi, mutability> = ContractFunctionName<
    abi,
    mutability
  >,
  args extends ContractFunctionArgs<abi, mutability, functionName> = ContractFunctionArgs<
    abi,
    mutability,
    functionName
  >,
> = abi extends Abi
  ? Abi extends abi
    ? unknown
    : AbiParametersToPrimitiveTypes<
          ExtractAbiFunctionForArgs<abi, mutability, functionName, args>["outputs"]
        > extends infer types
      ? types extends readonly []
        ? void
        : types extends readonly [infer type]
          ? type
          : types
      : never
  : unknown;

/** viem's `Widen`: the inferred `args`, widened to their ABI types. */
export type Widen<type> =
  | ([unknown] extends [type] ? unknown : never)
  | (type extends Function ? type : never)
  | (type extends bigint ? bigint : never)
  | (type extends boolean ? boolean : never)
  | (type extends number ? number : never)
  | (type extends string
      ? type extends Address
        ? Address
        : type extends Hex
          ? { inputs: Hex; outputs: Hex }
          : string
      : never)
  | (type extends readonly [] ? readonly [] : never)
  | (type extends Record<string, unknown> ? { [K in keyof type]: Widen<type[K]> } : never)
  | (type extends { length: number }
      ? {
          [K in keyof type]: Widen<type[K]>;
        } extends infer Val extends readonly unknown[]
        ? readonly [...Val]
        : never
      : never);
