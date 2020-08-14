---
description: >-
  The output schema automatically supports OpenCRUD filtering, pagination and
  ordering
---

# The Query Goodies

### Filtering

All the scalar entity types enjoy first-class support in the output schema when it comes to filtering. The standard is known as [OpenCRUD](https://www.opencrud.org/) and dictates who filtering should look like depending on the field type. For example, if the input schema defines the following type:

```text
type Person @entity {
    name: String!
    married: Boolean
    age: Int
    account: Bytes! @unique
    salary: BigInt
    interests: [String]
}
```

the output schema will support the following query:

```text
query {
    persons(where: { name_startsWith: "Joh", age_gt: 20 }) {
      name
    }
}
```

### Pagination

All queries enjoy support of pagination by accepting `offset` and `limit` input parameters. By default, `limit` is set to 5.

```graphql
query {
    persons(offset: 10, limit: 5) {
      name
    }
}
```

### Ordering

The results can also be ordered by any property with natural ordering. `_DESC`an  `_ASC` suffixes indicate the direction:

```graphql
query {
    persons(offset: 10, limit: 5, orderBy: name_ASC) {
      name
    }
}
```

