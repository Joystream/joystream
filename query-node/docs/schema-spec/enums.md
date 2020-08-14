# Enums

Enums are natively supported as described the GraphQL schema [spec](https://spec.graphql.org/June2018/#sec-Enums). Here is an illustrative example:

```text
enum {
  NONE
  REJECTED
  APPROVED
}

type Proposal @entity {
  status: ProposalStatus
  bond: BigInt!
}
```

