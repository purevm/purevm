/*
 * Public types of the function decoders: viem@2.56.9's parameters and return types
 * (`decodeFunctionData.ts`, `decodeFunctionResult.ts`), `abi` being one function or an ABI, plus
 * `options` and the compiled decoders.
 */
import type { Abi, AbiFunction, AbiStateMutability, Hex } from "../abi.types.ts";
import type { DecodeOptions } from "../decode.options.ts";
import type { IsNarrowable, UnionEvaluate } from "../types.utils.ts";
import type {
  ContractFunctionArgs,
  ContractFunctionName,
  ContractFunctionReturnType,
  Widen,
} from "./function.args.ts";

/** The common decoding options, plus the selector check. Every check is enabled unless `false`. */
export type DecodeFunctionOptions = DecodeOptions & {
  /** Require calldata to hold at least its 4-byte selector (`InvalidSelectorSizeError`). */
  readonly validateSelectorSize?: boolean | undefined;
};

/** One function is inferred as the ABI `[fn]`. */
export type FunctionAbiOf<abi> = abi extends readonly unknown[]
  ? abi
  : abi extends AbiFunction
    ? readonly [abi]
    : Abi;

type AbiSelectorFor<abi> = abi extends readonly unknown[]
  ? { readonly abiSelector?: never }
  : {
      /** Trusted selector for `abi`; skips keccak but is still matched against the calldata. */
      readonly abiSelector?: Hex | undefined;
    };

// ------------------------------------------------------------------ calldata

export type DecodeFunctionDataParameters<
  abi extends AbiFunction | readonly unknown[] = Abi,
  functionName extends ContractFunctionName<FunctionAbiOf<abi>> | undefined = undefined,
> = {
  /** One function, or an ABI whose function is found by the calldata selector. */
  readonly abi: abi;
  readonly data: Hex;
  /** The function selected by the calldata must have this name. Also narrows the return type. */
  readonly functionName?: functionName | ContractFunctionName<FunctionAbiOf<abi>> | undefined;
  readonly options?: DecodeFunctionOptions | undefined;
} & AbiSelectorFor<abi>;

export type DecodeFunctionDataReturnType<
  abi extends Abi | readonly unknown[] = Abi,
  functionName extends ContractFunctionName<abi> | undefined = undefined,
  allFunctionNames extends ContractFunctionName<abi> =
    functionName extends ContractFunctionName<abi> ? functionName : ContractFunctionName<abi>,
> =
  IsNarrowable<abi, Abi> extends true
    ? UnionEvaluate<
        {
          [name in allFunctionNames]: {
            args: ContractFunctionArgs<abi, AbiStateMutability, name>;
            functionName: name;
          };
        }[allFunctionNames]
      >
    : {
        args: readonly unknown[] | undefined;
        functionName: string;
      };

// ------------------------------------------------------------------ return data

type FunctionNameOrAll<abi extends Abi | readonly unknown[], functionName> =
  functionName extends ContractFunctionName<abi> ? functionName : ContractFunctionName<abi>;

export type DecodeFunctionResultParameters<
  abi extends AbiFunction | readonly unknown[] = Abi,
  functionName extends ContractFunctionName<FunctionAbiOf<abi>> | undefined = ContractFunctionName<
    FunctionAbiOf<abi>
  >,
  args extends ContractFunctionArgs<
    FunctionAbiOf<abi>,
    AbiStateMutability,
    FunctionNameOrAll<FunctionAbiOf<abi>, functionName>
  > = ContractFunctionArgs<
    FunctionAbiOf<abi>,
    AbiStateMutability,
    FunctionNameOrAll<FunctionAbiOf<abi>, functionName>
  >,
  ///
  fullAbi extends Abi | readonly unknown[] = FunctionAbiOf<abi>,
  hasFunctions = fullAbi extends Abi
    ? Abi extends fullAbi
      ? true
      : [Extract<fullAbi[number], { type: "function" }>] extends [never]
        ? false
        : true
    : true,
  allArgs = ContractFunctionArgs<
    fullAbi,
    AbiStateMutability,
    FunctionNameOrAll<fullAbi, functionName>
  >,
  allFunctionNames = ContractFunctionName<fullAbi>,
> = {
  /** One function, or an ABI: its first function, or the one named `functionName`. */
  readonly abi: abi;
  readonly data: Hex;
  readonly options?: DecodeFunctionOptions | undefined;
} & UnionEvaluate<
  IsNarrowable<fullAbi, Abi> extends true
    ? fullAbi["length"] extends 1
      ? { readonly functionName?: functionName | allFunctionNames | undefined }
      : { readonly functionName: functionName | allFunctionNames }
    : { readonly functionName?: functionName | allFunctionNames | undefined }
> &
  UnionEvaluate<
    readonly [] extends allArgs
      ? {
          readonly args?:
            | allArgs
            | (fullAbi extends Abi ? (args extends allArgs ? Widen<args> : never) : never)
            | undefined;
        }
      : {
          readonly args?:
            | allArgs
            | (Widen<args> & (args extends allArgs ? unknown : never))
            | undefined;
        }
  > &
  (hasFunctions extends true ? unknown : never);

export type DecodeFunctionResultReturnType<
  abi extends Abi | readonly unknown[] = Abi,
  functionName extends ContractFunctionName<abi> | undefined = ContractFunctionName<abi>,
  args extends ContractFunctionArgs<abi, AbiStateMutability, FunctionNameOrAll<abi, functionName>> =
    ContractFunctionArgs<abi, AbiStateMutability, FunctionNameOrAll<abi, functionName>>,
> = ContractFunctionReturnType<abi, AbiStateMutability, FunctionNameOrAll<abi, functionName>, args>;

// ------------------------------------------------------------------ compiled decoders

export type CompileFunctionDataDecoderParameters<
  abi extends AbiFunction | readonly unknown[] = AbiFunction,
> = {
  /** One function, or an ABI whose functions are looked up by the calldata selector. */
  readonly abi: abi;
  readonly options?: DecodeFunctionOptions | undefined;
} & AbiSelectorFor<abi>;

/** Decodes calldata of one function, or of any function of an ABI. */
export type FunctionDataDecoder<abi extends AbiFunction | readonly unknown[] = AbiFunction> = {
  (data: Hex): DecodeFunctionDataReturnType<FunctionAbiOf<abi>>;
  /** The detached, frozen function, or copies of the ABI's functions. */
  readonly abi: abi extends readonly unknown[] ? readonly AbiFunction[] : abi;
  /** The selector checked for one function; `undefined` for an ABI. */
  readonly abiSelector: abi extends readonly unknown[] ? undefined : Hex;
  readonly options: Readonly<DecodeFunctionOptions>;
};

export type CompileFunctionResultDecoderParameters<
  abi extends AbiFunction | readonly unknown[] = AbiFunction,
  functionName extends ContractFunctionName<FunctionAbiOf<abi>> | undefined = ContractFunctionName<
    FunctionAbiOf<abi>
  >,
  args extends ContractFunctionArgs<
    FunctionAbiOf<abi>,
    AbiStateMutability,
    FunctionNameOrAll<FunctionAbiOf<abi>, functionName>
  > = ContractFunctionArgs<
    FunctionAbiOf<abi>,
    AbiStateMutability,
    FunctionNameOrAll<FunctionAbiOf<abi>, functionName>
  >,
> = Omit<DecodeFunctionResultParameters<abi, functionName, args>, "data">;

/** Decodes the return data of the function resolved at compilation. */
export type FunctionResultDecoder<
  abi extends AbiFunction | readonly unknown[] = AbiFunction,
  functionName extends ContractFunctionName<FunctionAbiOf<abi>> | undefined = ContractFunctionName<
    FunctionAbiOf<abi>
  >,
  args extends ContractFunctionArgs<
    FunctionAbiOf<abi>,
    AbiStateMutability,
    FunctionNameOrAll<FunctionAbiOf<abi>, functionName>
  > = ContractFunctionArgs<
    FunctionAbiOf<abi>,
    AbiStateMutability,
    FunctionNameOrAll<FunctionAbiOf<abi>, functionName>
  >,
> = {
  (data: Hex): DecodeFunctionResultReturnType<FunctionAbiOf<abi>, functionName, args>;
  /** The detached, frozen function resolved at compilation. */
  readonly abi: AbiFunction;
  readonly functionName: string;
  readonly options: Readonly<DecodeFunctionOptions>;
};
