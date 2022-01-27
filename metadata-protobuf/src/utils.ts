import { AnyMessage, AnyMetadataClass, DecodedMetadataObject } from './types'
import countries from 'i18n-iso-countries'
import langs from 'iso-639-1'
import subdivisions from 'iso-3166-2'

export function isSet<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined
}

export function isEmptyObject<T>(object: T): boolean {
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

// Checks if the provided code is valid according to ISO 3166-1 alpha-2 standard
export function isValidCountryCode(code: string): boolean {
  return countries.getAlpha2Codes()[code] !== undefined
}

// Checks if the provided code is valid according to ISO 639-1 standard
export function isValidLanguageCode(code: string): boolean {
  return langs.validate(code)
}

// According to ISO 3166-2 standard
export function isValidSubdivisionCode(code: string): boolean {
  return !!subdivisions.subdivision(code)
}
