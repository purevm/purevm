/* Public ABI shapes and type-level values compatible with abitype's default register. */

export type Hex = `0x${string}`;
export type Address = `0x${string}`;
export type AddressFormatter = (address: Address) => Address;
export type AddressFormat = "checksum" | AddressFormatter | null;

/**
 * @description Combines members of an intersection into a readable type.
 *
 * @see {@link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg}
 * @example
 * Prettify<{ a: string } & { b: string } & { c: number, d: bigint }>
 * => { a: string, b: string, c: number, d: bigint }
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

////////////////////////////////////////////////////////////////////////////////////////////////////
// abitype: ABI shapes

export type AbiParameter = {
  readonly type: string;
  readonly name?: string | undefined;
  /** Representation used by the Solidity compiler. */
  readonly internalType?: string | undefined;
  /** Required for tuple types; validated at runtime when `validateTypes` is enabled. */
  readonly components?: readonly AbiParameter[] | undefined;
};

export type AbiEventParameter = AbiParameter & { readonly indexed?: boolean | undefined };

export type AbiEvent = {
  readonly type: "event";
  readonly anonymous?: boolean | undefined;
  readonly inputs: readonly AbiEventParameter[];
  readonly name: string;
};

type PayableMutability = "payable" | "nonpayable";

export type AbiStateMutability = "pure" | "view" | PayableMutability;

export type AbiFunction = {
  readonly type: "function";
  readonly constant?: boolean | undefined;
  readonly gas?: number | undefined;
  readonly inputs: readonly AbiParameter[];
  readonly name: string;
  readonly outputs: readonly AbiParameter[];
  readonly payable?: boolean | undefined;
  readonly stateMutability: AbiStateMutability;
};

/**
 * Contract [ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html#json). Every
 * item kind stays: an ABI written inline with a constructor must still be an `Abi` for its events
 * to be inferred.
 */
export type Abi = readonly (
  | {
      readonly type: "constructor";
      readonly inputs: readonly AbiParameter[];
      readonly payable?: boolean | undefined;
      readonly stateMutability: PayableMutability;
    }
  | { readonly type: "error"; readonly inputs: readonly AbiParameter[]; readonly name: string }
  | AbiEvent
  | {
      readonly type: "fallback";
      readonly payable?: boolean | undefined;
      readonly stateMutability: PayableMutability;
    }
  | AbiFunction
  | { readonly type: "receive"; readonly stateMutability: "payable" }
)[];

export type ExtractAbiFunctions<
  abi extends Abi,
  abiStateMutability extends AbiStateMutability = AbiStateMutability,
> = Extract<abi[number], { type: "function"; stateMutability: abiStateMutability }>;

export type ExtractAbiFunctionNames<
  abi extends Abi,
  abiStateMutability extends AbiStateMutability = AbiStateMutability,
> = ExtractAbiFunctions<abi, abiStateMutability>["name"];

export type ExtractAbiFunction<
  abi extends Abi,
  functionName extends ExtractAbiFunctionNames<abi>,
  abiStateMutability extends AbiStateMutability = AbiStateMutability,
> = Extract<ExtractAbiFunctions<abi, abiStateMutability>, { name: functionName }>;

export type ExtractAbiEvents<abi extends Abi> = Extract<abi[number], { type: "event" }>;

export type ExtractAbiEventNames<abi extends Abi> = ExtractAbiEvents<abi>["name"];

export type ExtractAbiEvent<abi extends Abi, eventName extends ExtractAbiEventNames<abi>> = Extract<
  ExtractAbiEvents<abi>,
  { name: eventName }
>;

////////////////////////////////////////////////////////////////////////////////////////////////////
// abitype: ABI values

/** `1` … `32`, or `""` for `bytes`. */
type MBytes = "" | Range<1, 32>[number];
/** `8` … `256` by 8, or `""` for `int` and `uint`. */
// prettier-ignore
type MBits =
  | "" | 8 | 16 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80 | 88 | 96 | 104 | 112 | 120 | 128
  | 136 | 144 | 152 | 160 | 168 | 176 | 184 | 192 | 200 | 208 | 216 | 224 | 232 | 240 | 248 | 256;

/** Value of each type that is neither a tuple nor an array (abitype's `PrimitiveTypeLookup`). */
type BasicTypes = {
  address: Address;
  bool: boolean;
  string: string;
} & { [type in `bytes${MBytes}`]: Hex } & {
  [type in `${"u" | ""}int${MBits}`]: type extends `${"u" | ""}int${8 | 16 | 24 | 32 | 40 | 48}`
    ? number
    : bigint;
};

// From [Type Challenges](https://github.com/type-challenges/type-challenges/issues/11625)
type Range<
  start extends number,
  stop extends number,
  ///
  result extends readonly number[] = [],
  padding extends readonly 0[] = [],
  current extends number = [...padding, ...result]["length"] & number,
> = current extends stop
  ? current extends start
    ? [current]
    : result extends []
      ? []
      : [...result, current]
  : current extends start
    ? Range<start, stop, [current], padding>
    : result extends []
      ? Range<start, stop, [], [...padding, 0]>
      : Range<start, stop, [...result, current], padding>;

type FixedArrayLength = Range<1, 99>[number];
type FixedArraySizeLookup = { [length in FixedArrayLength as `${length}`]: length };

// https://github.com/Microsoft/TypeScript/issues/26223#issuecomment-674500430
type Tuple<
  type,
  size extends number,
  acc extends readonly unknown[] = [],
> = acc["length"] extends size ? acc : Tuple<type, size, readonly [type, ...acc]>;

/** `T[]` → `["T", ""]`, `T[3]` → `["T", "3"]`, anything else → `undefined`. */
type MaybeExtractArrayParameterType<type> =
  type extends `${infer head}[${"" | `${FixedArrayLength}`}]`
    ? type extends `${head}[${infer size}]`
      ? [head, size]
      : undefined
    : undefined;

/** TypeScript value of an ABI parameter; `unknown` for a type it does not know. */
export type AbiParameterToPrimitiveType<
  abiParameter extends AbiParameter | { name: string; type: unknown },
> = abiParameter["type"] extends keyof BasicTypes
  ? BasicTypes[abiParameter["type"]]
  : abiParameter extends {
        type: "tuple";
        components: infer components extends readonly AbiParameter[];
      }
    ? AbiComponentsToPrimitiveType<components>
    : MaybeExtractArrayParameterType<abiParameter["type"]> extends [
          infer head extends string,
          infer size,
        ]
      ? size extends keyof FixedArraySizeLookup
        ? Tuple<
            AbiParameterToPrimitiveType<Omit<abiParameter, "type"> & { type: head }>,
            FixedArraySizeLookup[size]
          >
        : readonly AbiParameterToPrimitiveType<Omit<abiParameter, "type"> & { type: head }>[]
      : unknown;

/** Values of a parameter list, by position (abitype's `AbiParametersToPrimitiveTypes`). */
export type AbiParametersToPrimitiveTypes<abiParameters extends readonly AbiParameter[]> = {
  [key in keyof abiParameters]: AbiParameterToPrimitiveType<abiParameters[key]>;
};

/** A tuple is an object when all its components are named, an array otherwise (like viem). */
type AbiComponentsToPrimitiveType<components extends readonly AbiParameter[]> =
  components extends readonly []
    ? []
    : components[number]["name"] extends Exclude<
          components[number]["name"] & string,
          undefined | ""
        >
      ? {
          [
            component in components[number] as component["name"] & {}
          ]: AbiParameterToPrimitiveType<component>;
        }
      : { [key in keyof components]: AbiParameterToPrimitiveType<components[key]> };
