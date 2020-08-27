---
description: Run cross-field and cross-entity full-text queries
---

# Full-text queries

Full-text queries are able to search across a large amount of text data and aggregate the results across multiple fields and even entities. The query output provides the result rank and a highlight if there is a text match. 

In order to enable full-text search queries in the API, decorate any number of `String`fields with `@fulltext(query: <query_name>)` decorator, like this:

```graphql
type Post @entity{
   title: String @fulltext(query: "forum"),
   body: String @fulltext(query: "forum")
}

type Comment @entity {
   text: String @fulltext(query: "forum")
}
```

The generated output schema will define the required output type and the query:

```graphql
type SearchResult {
   item: Post | Comment,
   rank: number, 
   highligt: String
}

type Query {
   forum(text: String, limit?: Int): SearchResult[]
}
```

One can now run similarity query:

```graphql
query {
   forum(text: "some partially matching text", limit: 5) {
      rank
      highlight 
      item {
         ... on Post {
            body
         }
         ... on Comment {
            title
         }
      }
       
   }
}
```

