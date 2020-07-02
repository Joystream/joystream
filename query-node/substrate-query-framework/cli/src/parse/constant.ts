/**
 * This preamble is added to the schema in order to pass the SDL validation
 * Add additional scalar types and directives to the schema
 */
export const SCHEMA_DEFINITIONS_PREAMBLE = `
directive @variant on OBJECT # varaint types
directive @entity on OBJECT | INTERFACE  # Mark both object types and interfaces
directive @unique on FIELD_DEFINITION
scalar BigInt                # Arbitrarily large integers
scalar BigDecimal            # is used to represent arbitrary precision decimals
scalar Bytes                 # Byte array, represented as a hexadecimal string
type Query {
    _dummy: String           # empty queries are not allowed
}
`;

export const ENTITY_DIRECTIVE = 'entity';
export const UNIQUE_DIRECTIVE = 'unique';
export const VARIANT_DIRECTIVE = 'variant';
