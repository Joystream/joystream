import { AnyMessage, AnyMetadataClass, DecodedMetadataObject } from './types'
import countries from 'i18n-iso-countries'

export function isSet<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined
}

export function isEmptyObject(object: Record<string, any>): boolean {
  return Object.keys(object).length === 0
}

export function integrateMeta<
  T,
  Props extends readonly (keyof T & keyof M & string)[],
  M extends { [K in Props[number]]?: T[K] | null }
>(object: T, meta: M, props: Props): void {
  props.forEach((prop) => {
    const metaPropVal = meta[prop] as T[Props[number]] | null | undefined
    if (isSet(metaPropVal)) {
      object[prop] = metaPropVal
    }
  })
}

export function encodeDecode<T>(metaClass: AnyMetadataClass<T>, value: T): DecodedMetadataObject<T> {
  const encoded = metaClass.encode(value).finish()
  return metaToObject(metaClass, metaClass.decode(encoded))
}

export function metaToObject<T>(metaClass: AnyMetadataClass<T>, value: AnyMessage<T>): DecodedMetadataObject<T> {
  // Default conversion options - use Strings for "Long" values and ignore unset "repeated" fields
  return metaClass.toObject(value, { arrays: false, longs: String }) as DecodedMetadataObject<T>
}

// According to ISO 3166-1 alpha-2 standard
export function isValidCountryCode(code: string): boolean {
  return countries.getAlpha2Codes()[code] !== undefined
}
