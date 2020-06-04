export interface ScalarType {
  [name: string]: string;
}

// Supported built-in scalar types and corressponding warthog type
export const availableTypes: ScalarType = {
  ID: '', // store as a string
  String: '',
  Int: 'int',
  Boolean: 'bool',
  Date: 'date',
  Float: 'float',
  BigInt: 'numeric',
  BigDecimal: 'decimal',
  Bytes: 'bytes'
};