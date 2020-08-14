# Algebraic types

One can construct complex types by defining unions of special non-entity type definitions decorated with `@variant`. The resulting complex type is mapped into JSON at the database level and should be prefixed with `_json` in when queried through the API. Here is an example

```graphql
type Miserable @variant {
  hates: String!
}

type HappyPoor @variant {
  isMale: boolean
}

union Poor = HappyPoor | Miserable

type MiddleClass @variant {
  father: Poor
  mother: Poor
}

type Rich @variant {
  bank: EntityC
}

union Status = Poor | MiddleClass | HappyPoor | Miserable

type Account @entity {
  status: Status!
}
```

The resulting API will support [inline fragments](https://graphql.org/learn/schema/#union-types) and type resolutions:

```graphql
query {
	accounts(limit: 5, orderBy: about_ASC, where: { status_json: { father: { isMale_eq: true }} }) {
    about
    status {
      __typename 
      ... on MiddleClass {
        father {
          ... on HappyPoor {
            isMale
          }
          ... on Miserable {
            hates
          }
        }
      }
    }
  }
}
```

