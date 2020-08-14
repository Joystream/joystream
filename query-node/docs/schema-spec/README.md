---
description: >-
  The schema file describes your domain objects, relationships and the supported
  queries.
---

# Schema

## Overview

Hydra input schema is a dialect of the GraphQL schema definition language enriched with the additional directives and built-in primitive types described in what follows. The input schema is consumed by `hydra-cli codegen` to generate the entity classes for the database and the final API GraphQL schema served by the server. The latter is auto-generated and can be previewed by running 

```text
$ hydra-cli preview && cat apipreview.graphql
```

