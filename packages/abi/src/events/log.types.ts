/* Public types of the stateless and explicitly compiled event-log decoders. */
import type { Abi, AbiEvent, Hex, Prettify } from "../abi.types.ts";
import type { DecodeOptions } from "../decode.options.ts";
import type {
  ContractEventArgsFromTopics,
  ContractEventName,
  IsNarrowable,
  UnionEvaluate,
} from "./log.args.ts";

/** The common decoding options, plus the topic checks. Every check is enabled unless `false`. */
export type DecodeEventLogOptions = DecodeOptions & {
  /** Reject topics after the last indexed parameter (`TooManyTopicsError`). */
  readonly validateTopicCount?: boolean | undefined;
  /** Require every argument topic to be exactly one 32-byte word (`InvalidTopicSizeError`). */
  readonly validateTopicSize?: boolean | undefined;
};

export type EventLogPayload<
  topics extends readonly Hex[] = readonly Hex[],
  data extends Hex | undefined = Hex | undefined,
> = {
  readonly topics: topics;
  readonly data?: data | undefined;
};

/** One event is inferred as the ABI `[event]`. */
export type AbiOf<abi> = abi extends readonly unknown[]
  ? abi
  : abi extends AbiEvent
    ? readonly [abi]
    : Abi;

type PayloadFor<topics extends readonly Hex[], data extends Hex | undefined> = EventLogPayload<
  topics,
  data
>;

type AbiTopic0For<abi> = abi extends readonly unknown[]
  ? { readonly abiTopic0?: never }
  : abi extends { readonly anonymous: true }
    ? { readonly abiTopic0?: never }
    : {
        /** Trusted selector for `abi`; skips keccak but is still matched against the payload. */
        readonly abiTopic0?: Hex | undefined;
      };

export type DecodeEventLogParameters<
  abi extends AbiEvent | Abi | readonly unknown[] | object = Abi,
  eventName extends ContractEventName<AbiOf<abi>> | undefined = ContractEventName<AbiOf<abi>>,
  topics extends readonly Hex[] = readonly Hex[],
  data extends Hex | undefined = undefined,
> = {
  /** One event, or an ABI whose event is found from `payload.topics[0]`. */
  readonly abi: abi;
  /** The event selected by topic0 must have this name. Also narrows the return type. */
  readonly eventName?: eventName | undefined;
  readonly payload: PayloadFor<topics, data>;
  readonly options?: DecodeEventLogOptions | undefined;
} & AbiTopic0For<abi>;

export type CompileEventLogDecoderParameters<abi extends AbiEvent | readonly unknown[] = AbiEvent> =
  {
    /** One event, or an ABI whose events are looked up by `payload.topics[0]`. */
    readonly abi: abi;
    readonly options?: DecodeEventLogOptions | undefined;
  } & AbiTopic0For<abi>;

export type DecodeEventLogReturnType<
  abi extends Abi | readonly unknown[] = Abi,
  eventName extends ContractEventName<abi> | undefined = ContractEventName<abi>,
  topics extends readonly Hex[] = readonly Hex[],
  data extends Hex | undefined = undefined,
  allEventNames extends ContractEventName<abi> = eventName extends ContractEventName<abi>
    ? eventName
    : ContractEventName<abi>,
> =
  IsNarrowable<abi, Abi> extends true
    ? {
        [name in allEventNames]: Prettify<
          {
            eventName: name;
          } & UnionEvaluate<
            ContractEventArgsFromTopics<abi, name> extends infer allArgs
              ? topics extends readonly []
                ? data extends undefined
                  ? { args?: undefined }
                  : { args?: allArgs | undefined }
                : { args: allArgs }
              : never
          >
        >;
      }[allEventNames]
    : {
        eventName: allEventNames;
        args: readonly unknown[] | undefined;
      };

type SingleEventReturnType<event extends AbiEvent> = Prettify<
  { eventName: event["name"] } & (number extends event["inputs"]["length"]
    ? {
        args:
          | ContractEventArgsFromTopics<readonly [event], ContractEventName<readonly [event]>>
          | undefined;
      }
    : event["inputs"] extends readonly []
      ? { args?: undefined }
      : {
          args: ContractEventArgsFromTopics<readonly [event], ContractEventName<readonly [event]>>;
        })
>;

export type DecodeEventLogResult<
  abi extends AbiEvent | readonly unknown[] | object,
  eventName extends ContractEventName<AbiOf<abi>> | undefined,
  topics extends readonly Hex[],
  data extends Hex | undefined,
> = abi extends AbiEvent & { readonly anonymous: true }
  ? SingleEventReturnType<abi>
  : DecodeEventLogReturnType<AbiOf<abi>, eventName, ArgumentTopics<topics>, data>;

type ArgumentTopics<topics extends readonly Hex[]> = topics extends readonly [
  signature: Hex,
  ...args: infer args extends readonly Hex[],
]
  ? args
  : readonly Hex[];

/** The decoder compiled for `abi`: one event, or an ABI. */
export type EventLogDecoder<abi extends AbiEvent | readonly unknown[] = AbiEvent> =
  abi extends readonly unknown[]
    ? AbiEventLogDecoder<abi>
    : abi extends AbiEvent
      ? SingleEventLogDecoder<abi>
      : never;

/** Decodes the logs of one event. */
export type SingleEventLogDecoder<event extends AbiEvent = AbiEvent> = {
  <
    const topics extends readonly Hex[] = readonly Hex[],
    const data extends Hex | undefined = undefined,
  >(
    payload: PayloadFor<topics, data>,
  ): SingleEventReturnType<event>;
  readonly abi: event;
  readonly abiTopic0: event extends { readonly anonymous: true }
    ? undefined
    : true extends event["anonymous"]
      ? Hex | undefined
      : Hex;
  readonly options: Readonly<DecodeEventLogOptions>;
};

/**
 * Decodes the logs of any event of an ABI, found by `payload.topics[0]` in a table built once at
 * compilation. Same results as `decodeEventLog` with this ABI.
 */
export type AbiEventLogDecoder<abi extends readonly unknown[] = Abi> = {
  <
    const topics extends readonly Hex[] = readonly Hex[],
    const data extends Hex | undefined = undefined,
  >(
    payload: PayloadFor<topics, data>,
  ): DecodeEventLogResult<abi, undefined, topics, data>;
  /** Detached, frozen copies of the ABI's events. */
  readonly abi: readonly AbiEvent[];
  readonly abiTopic0: undefined;
  readonly options: Readonly<DecodeEventLogOptions>;
};

/** Type-erased decoder for heterogeneous runtime registries keyed by topic0. */
export type AnyEventLogDecoder = {
  (payload: EventLogPayload): {
    eventName: string;
    args?: readonly unknown[] | undefined;
  };
  readonly abi: AbiEvent;
  readonly abiTopic0: Hex | undefined;
  readonly options: Readonly<DecodeEventLogOptions>;
};
