import { Long } from 'long'
import { IConversionOptions } from 'protobufjs'

export type AnyMessage<T> = T & {
  toJSON(): Record<string, unknown>
}

export type AnyMetadataClass<T> = {
  name: string
  decode(binary: Uint8Array): AnyMessage<T>
  encode(obj: T): { finish(): Uint8Array }
  toObject(obj: AnyMessage<T>, options?: IConversionOptions): Record<string, unknown>
  verify(message: { [k: string]: unknown }): null | string
  fromObject(object: { [k: string]: unknown }): AnyMessage<T>
}

export type DecodedMetadataObject<T> = {
  [K in keyof T]: T[K] extends Long | null | undefined
    ? Exclude<T[K], Long> | string
    : T[K] extends string | number | boolean | null | undefined
    ? T[K]
    : T[K] extends Array<infer S>
    ? DecodedMetadataObject<S>[]
    : DecodedMetadataObject<T[K]>
}
