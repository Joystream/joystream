# @joystreamjs/utils

Common utilities used by different Joystreamjs packages.

Package structure:

- `src/schemas/json/` JSON schemas
- `typings/` Type definitions generated from JSON schemas using `json-schema-to-typescript`

## Installation

```
yarn install @joystreamjs/utils
```

## Development

1. Run `yarn` to install dependencies
2. Run `yarn build` to build the package
3. Run `yarn generate:schema-typings` to generate TS type definitions of JSON schemas

## Usage

### Read stream of bytes from file

Read a range of bytes from input file provided `start` and `end` values.
Both `start` and `end` are inclusive

```javascript
import { getByteSequenceFromFile } from '@joystreamjs/utils'

const inputFilePath = './payload'
const start = 10
const end = 20
const bytes = await getByteSequenceFromFile(inputFilePath, start, end)
```
