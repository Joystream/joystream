# Content directory tooling

## Definitions

In order to make this documentation as clear as possible it is important to make a strict distinction between two types of schemas:

- `json-schemas` mean files with `.schema.json` extension. This is a common standard for describing how to validate other `json` files or objects (ie. a `package.json` file may be an example of a file that can be supported by a `json-schema`). A documentation of this standard can be found here: https://json-schema.org/
- `runtime-scheams` means schemas as they are "understood" by the `content-directory` runtime module, so schemas that can be added to classes via `api.tx.contentDirectory.addClassSchema` and linked to entities via `api.tx.contentDirectory.addSchemaSupportToEntity`

## Content directory input

### Initializing content directory

In order to intialize the content directory on a development chain based on data that is provided in form of json files inside `/inputs` directory (`classes`, `schemas` and example entities - `entityBatches`), we can run:

```
yarn workspace @joystream/cd-schemas initialize:dev
```

This will handle:

- Creating a membership for `ALICE` (if not already created)
- Setting (hiring) `ALICE` as content curators lead (if not already set)
- Creating classes in the runtime based on `inputs/classes` json inputs (if the content directory is currently empty)
- Creating schemas in the runtime based on `inputs/schemas` and adding them to the related classes
- Creating entities based on `inputs/entityBatches`. Those json inputs allow describing entities and relationships between them in a simplified way and are then converted into one huge `api.tx.contentDirectory.transaction` call (this is further described in _**Entity batches**_ section).

### Input files naming

In order to get the full benefit of the tooling, in some cases you may need to respect a specific pattern of file naming:

Each input file name should end with `Class`, `Schema` or `Batch` (depending on the input type, ie. `LanguageBatch`).
It is also recommended that each of those file names starts with a class name (currently in `entityBatches` there's no distinction between schemas and classes, as it is assumed there will be a one-to-one relationship between them)

### `json-schemas` support for json inputs in `VSCode`

In order to link json files inside `inputs` directory to `json-schemas` inside `schemas` and have them validated in real-time by the IDE, follow the steps below:

**If you don't have `.vscode/settings.json` in the root monorepo workspace yet:**

1. Create `.vscode` directory inside your monorepo workspace
1. Copy `vscode-recommended.settings.json` into this `.vscode` directory and rename it to `settings.json`.

**If you already have the `.vscode/settings.json` file in the root monorepo workspace:**

1. Copy the settings from `vscode-recommended.settings.json` and merge them with the existing `.vscode/settings.json`

Now all the json files matching `*Class.json`, `*Schema.json`, `*{EntityName}Batch.json` patters will be linked to the correct `json schemas`. If you edit any file inside `inputs` or add a new one that follows the naming pattern (described in _Input files naming_), you should get the benefit of autocompleted properties, validated input, on-hover tooltips with property descriptions etc.

For more context, see: https://code.visualstudio.com/docs/languages/json

### Validate inputs and `json-schemas` via a command

All inputs inside `inputs` directory and `json-schemas` used to validate those inputs can also be validated using `yarn workspace @joystream/cd-schemas validate` command. This is mainly to facilitate checking the validity of `.json` and `.schema.json` files inside `content-directory-schemas` through CI.

### Entity batches

The concept of entity batches (`inputs/entityBatches`) basically provides an easy way of describing complex input to content directory (ie. many entities related to each other in many ways) without the need to deal with lower-level, hard-to-validate runtime operations like `CreateEntity` and `AddSchemaSupportEntity` and trying to glue them together into a huge `api.tx.contentDirectory.transaction` call.

Instead, the script that initializes the content directory (`scripts/initializeContentDir.ts`) is able to generate the complex `api.tx.contentDirectory.transaction` call based on a more human-readable input provided in `inputs/entityBatches`.

This input can be provided as a simple json array of objects matching `{ [propertyName]: propertyValue}` structure.

For example, in order to describe creating entities as simple as `Language`, which only has `Code` and `Name` properties, we can just create an array of objects like:

```
[
  { "Code": "EN", "Name": "English" },
  { "Code": "RU", "Name": "Russian" },
  { "Code": "DE", "Name": "German" }
]
```

_(This is the actual content of `inputs/entityBatches/LanguageBatch.json`)_

#### Related entities

There also exists a specific syntax for defining relations between entities in batches.
We can do it by either using `"new"` or `"existing"` keyword.

- The `"new"` keyword allows describing a scenario where related entity should be created **along with** the main entity and then referenced by it. An example of this could be `Video` and `VideoMedia` which have a one-to-one relationship and it doesn't make much sense to specify them in separate batches. Instead, we can use a syntax like:

```
{
  "title": "Awesome video",
  /* other Video properties... */
  "media": { "new": {
    "pixelWidth": 1024,
    "pixelHeight": 764,
    /* other VideoMedia object properties... */
  }
}
```

- The `"existing"` keyword allows referencing an entity created as part of any other batch inside `inputs/entityBatches`. We can do it by specifying the value of **any unique property of the referenced entity**. So, for example to reference a `Language` entity from `VideoBatch.json` file, we use this syntax:

```
{
  "title": "Awesome video",
  /* other Video properties... */
  "language": { "existing": { "Code": "EN" } }
}
```

## `json-schemas` and tooling

### Entity `json-schemas`

There is a script that provides an easy way of converting `runtime-schemas` (based on inputs from `inputs/schemas`) to `json-schemas` (`.schema.json` files) which allow validating the input (ie. json files) describing some specific entities. It can be run with:

```
yarn workspace @joystream/cd-schemas generate:entity-schemas
```

Those `json-schemas` are currently mainly used for validating the inputs inside `inputs/entityBatches`.

The generated `json-schemas` include:

- `schemas/entities` - `json-schemas` that provide validation for given entity (ie. `Video`) input. They can, for example, check if the `title` property in a json object is a string that is no longer than `64` characters. They are used to validate a single entity in `inputs/entityBatches`, but can also be re-used to provide "frontend" validation of any entity input to the content directory (ie. input provided to/via `joystream-cli`).
- `schemas/entityReferences` - `json-schemas` that describe how an entity of given class can be referenced. Currently they are used for providing an easy way of referencing entites between batches in `inputs/entityBatches`. For more details on how entities can be referenced in batches, read the _**Entity batches**_ section.
- `schemas/entityBatches` - very simple `json-schemas` that basically just provide `array` wrappers over `schemas/entities`. Those are the actual `json-schemas` that can be linked to json input files inside `inputs/entityBatches` (ie. via `.vscode/settings.json`)

### Typescript support

Thanks to the `json-schema-to-typescript` library, we can very simply generate Typescript interfaces based on existing `json-schemas`. This can be done via:

```
yarn workspace @joystream/cd-schemas generate:types
```

This command will generate:

- `types/entities` based on `schemas/entities`, providing typescript interfaces for entities like `Video` etc. (note that this interface will include a peculiar way of describing entity relationships, further described in _**Entity batches**_ section)
- `types/extrinsics` based on `schemas/extrinsics`, providing typescript interfaces for input to extrinsics like `AddClassSchema` and `CreateClass`

The most obvious use-case of those interfaces currently is that when we're parsing any json files inside `inputs` using a Typescript code, we can assert that the resulting object will be of given type, ie.:

```
const createClassInput = JSON.parse(fs.readFileSync('/path/to/inputs/LanguageClass.json')) as CreateClass
```

Besides that, a Typescript code can be written to generate some inputs (ie. using a loop) that can then can be used to create classes/schemas or insert entities into the content directory.

There are a lot of other potential use-cases, but for the purpose of this documentation it should be enough to mention there exists this very easy way of converting `.schema.json` files into Typescript interfaces.

## Using as library

The `content-directory-schemas` directory of the monorepo is constructed in such a way, that it should be possible to use it as library and import from it json schemas, types (mentioned in `Typescript support` section) and tools to, for example, convert entity input like this described in the `Entity batches` section into `CreateEntity`, `AddSchemaSupportToEntity` and/or `UpdateEntityPropertyValues` operations.

### Examples

The best way to ilustrate this would be by providing some examples:

#### Creating a channel
```
  import { InputParser } from '@joystream/cd-schemas'
  import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
  // Other imports...

  async main() {
    // Initialize the api, SENDER_KEYPAIR and SENDER_MEMBER_ID...

    const channel: ChannelEntity = {
      handle: 'Example channel',
      description: 'This is an example channel',
      language: { existing: { code: 'EN' } },
      coverPhotoUrl: '',
      avatarPhotoUrl: '',
      isPublic: true,
    }

    const parser = InputParser.createWithKnownSchemas(api, [
      {
        className: 'Channel',
        entries: [channel],
      },
    ])

    const operations = await parser.getEntityBatchOperations()
    await api.tx.contentDirectory
      .transaction({ Member: SENDER_MEMBER_ID }, operations)
      .signAndSend(SENDER_KEYPAIR)
  }
```
_Full example with comments can be found in `content-directory-schemas/examples/createChannel.ts` and ran with `yarn workspace @joystream/cd-schemas example:createChannel`_

#### Creating a video
```
import { InputParser } from '@joystream/cd-schemas'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'
// ...

async main() {
  // ...

  const video: VideoEntity = {
    title: 'Example video',
    description: 'This is an example video',
    language: { existing: { code: 'EN' } },
    category: { existing: { name: 'Education' } },
    channel: { existing: { handle: 'Example channel' } },
    media: {
      new: {
        encoding: { existing: { name: 'H.263_MP4' } },
        pixelHeight: 600,
        pixelWidth: 800,
        location: {
          new: {
            httpMediaLocation: {
              new: { url: 'https://testnet.joystream.org/' },
            },
          },
        },
      },
    },
    license: {
      new: {
        knownLicense: {
          existing: { code: 'CC_BY' },
        },
      },
    },
    duration: 3600,
    thumbnailUrl: '',
    isExplicit: false,
    isPublic: true,
  }

  const parser = InputParser.createWithKnownSchemas(api, [
    {
      className: 'Video',
      entries: [video],
    },
  ])

  const operations = await parser.getEntityBatchOperations()
  await api.tx.contentDirectory
    .transaction({ Member: SENDER_MEMBER_ID }, operations)
    .signAndSend(SENDER_KEYPAIR)
}
```
_Full example with comments can be found in `content-directory-schemas/examples/createVideo.ts` and ran with `yarn workspace @joystream/cd-schemas example:createChannel`_

#### Update channel handle

```
import { InputParser } from '@joystream/cd-schemas'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
// ...

async function main() {
  // ...

  const channelUpdateInput: Partial<ChannelEntity> = {
    handle: 'Updated channel handle',
  }

  const parser = InputParser.createWithKnownSchemas(api)

  const CHANNEL_ID = await parser.findEntityIdByUniqueQuery({ handle: 'Example channel' }, 'Channel')

  const updateOperations = await parser.getEntityUpdateOperations(channelUpdateInput, 'Channel', CHANNEL_ID)

  await api.tx.contentDirectory
    .transaction({ Member: SENDER_MEMBER_ID }, [updateOperation])
    .signAndSend(SENDER_KEYPAIR)
}
```
_Full example with comments can be found in `content-directory-schemas/examples/updateChannelHandle.ts` and ran with `yarn workspace @joystream/cd-schemas example:updateChannelHandle`_

Note: Updates can also inlucde `new` and `existing` keywords. In case `new` is specified inside the update - `CreateEntity` and `AddSchemaSupportToEntity` operations will be included as part of the operations returned by `InputParser.getEntityUpdateOperations`.

## Current limitations

Some limitations that should be dealt with in the nearest future:

- Filename restrictions described in **_Input files naming_** section
- Some code runs on the assumption that there is only one schema for each class, which is very limiting
- `Vector<Reference>` property type is not yet supported when parsing entity batches
