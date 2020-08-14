---
description: Entities is the backbone of the data model and translate into the db schema
---

# Entities

Entities are the top-level type definitions in the input schema marked with the `@entity` directive. Entity fields are normally built-in scalar types but can also be 

* an array of a primitive types
* an [enum](enums.md),
* an [entity reference](entity-relationship.md)
* an [algebraic type ](variant-types.md)

All entities have an auto-generated `ID` field which is reserved and cannot be used in the input schema.

### Primitive types

The following scalar types are supported:

* `Boolean`
* `String`
* `Int`
* `Float`
* `BigInt` supports arbitrarily large numbers and is useful for representing e.g. data `uint256`
* `Bytes`

Arrays follow the GraphQL [spec](https://spec.graphql.org/June2018/).

### Modifiers and decorators 

By default, each field is nullable. To indicate a no-null constraint mark the field with `!`

If a property must be unique across all entities of the given type, mark it with a built-in `@unique` directive

Schema comments are natively supported and are propagated to the output schema

### Example

```graphql
"It is just a boring nine-five person"
type Person @entity {
    name: String!
    married: Boolean
    age: Int
    "one person, one account, one live"
    account: Bytes! @unique
    salary: BigInt
    interests: [String]
}
```

