/**
 * This preamble is added to the schema in order to pass the SDL validation
 * Add additional scalar types and directives to the schema
 */
export const SCHEMA_DEFINITIONS_PREAMBLE = `
directive @entity on OBJECT  # Make type defination entity
scalar BigInt                # Arbitrarily large integers
scalar BigDecimal            # is used to represent arbitrary precision decimals
scalar Bytes                 # Byte array, represented as a hexadecimal string
type Query {
    _dummy: String           # empty queries are not allowed
}
`