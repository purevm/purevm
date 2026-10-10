/* Type-level inference of event names and decoded arguments. */
import type {
  Abi,
  AbiParameter,
  AbiParameterToPrimitiveType,
  ExtractAbiEvent,
  ExtractAbiEventNames,
} from "../abi.types.ts";

export type { IsNarrowable, UnionEvaluate } from "../types.utils.ts";

export type ContractEventName<abi extends Abi | readonly unknown[] = Abi> =
  ExtractAbiEventNames<abi extends Abi ? abi : Abi> extends infer eventName extends string
    ? [eventName] extends [never]
      ? string
      : eventName
    : string;

export type ContractEventArgsFromTopics<
  abi extends Abi | readonly unknown[] = Abi,
  eventName extends ContractEventName<abi> = ContractEventName<abi>,
> =
  EventArgs<ExtractAbiEvent<abi extends Abi ? abi : Abi, eventName>["inputs"]> extends infer args
    ? [args] extends [never]
      ? readonly unknown[]
      : args
    : readonly unknown[];

/** A decoded event always follows the ABI input order, independently of parameter names. */
type EventArgs<abiParameters extends readonly AbiParameter[]> = abiParameters extends readonly []
  ? readonly []
  : ToTuple<abiParameters> extends infer Filtered extends readonly AbiParameter[]
    ? readonly [
        ...{
          [K in keyof Filtered]: AbiParameterToPrimitiveType<Filtered[K]>;
        },
      ]
    : never;

/** viem's `Filter<items, object>`: a readonly copy of a tuple, `readonly []` for any other array. */
type ToTuple<
  T extends readonly unknown[],
  Acc extends readonly unknown[] = [],
> = T extends readonly [infer F, ...infer Rest extends readonly unknown[]]
  ? [F] extends [object]
    ? ToTuple<Rest, [...Acc, F]>
    : ToTuple<Rest, Acc>
  : readonly [...Acc];
