import { ApiPromise, WsProvider } from '@polkadot/api'
import { types as joyTypes } from '@joystream/types'
import { Keyring } from '@polkadot/keyring'
// Import input parser and video entity from @joystream/cd-schemas (we use it as library here)
import { InputParser } from '@joystream/cd-schemas'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'

async function main() {
  // Initialize the api
  const provider = new WsProvider('ws://127.0.0.1:9944')
  const api = await ApiPromise.create({ provider, types: joyTypes })

  // Get Alice keypair
  const keyring = new Keyring()
  keyring.addFromUri('//Alice', undefined, 'sr25519')
  const [ALICE] = keyring.getPairs()

  const video: VideoEntity = {
    title: 'Example video',
    description: 'This is an example video',
    // We reference existing language and category by their unique properties with "existing" syntax
    // (those referenced here are part of inputs/entityBatches)
    language: { existing: { code: 'EN' } },
    category: { existing: { name: 'Education' } },
    // We use the same "existing" syntax to reference a channel by unique property (handle)
    // In this case it's a channel that we created in createChannel example
    channel: { existing: { handle: 'Example channel' } },
    media: {
      // We use "new" syntax to sygnalize we want to create a new VideoMedia entity that will be related to this Video entity
      new: {
        // We use "exisiting" enconding from inputs/entityBatches/VideoMediaEncodingBatch.json
        encoding: { existing: { name: 'H.263_MP4' } },
        pixelHeight: 600,
        pixelWidth: 800,
        // We create nested VideoMedia->MediaLocation->HttpMediaLocation relations using the "new" syntax
        location: { new: { httpMediaLocation: { new: { url: 'https://testnet.joystream.org/' } } } },
      },
    },
    // Here we use combined "new" and "existing" syntaxes to create Video->License->KnownLicense relations
    license: {
      new: {
        knownLicense: {
          // This license can be found in inputs/entityBatches/KnownLicenseBatch.json
          existing: { code: 'CC_BY' },
        },
      },
    },
    duration: 3600,
    thumbnailUrl: '',
    isExplicit: false,
    isPublic: true,
  }
  // Create the parser with known entity schemas (the ones in content-directory-schemas/inputs)
  const parser = InputParser.createWithKnownSchemas(
    api,
    // The second argument is an array of entity batches, following standard entity batch syntax ({ className, entries }):
    [
      {
        className: 'Video',
        entries: [video], // We could specify multiple entries here, but in this case we only need one
      },
    ]
  )
  // We parse the input into CreateEntity and AddSchemaSupportToEntity operations
  const operations = await parser.getEntityBatchOperations()
  await api.tx.contentDirectory
    .transaction(
      { Member: 0 }, // We use member with id 0 as actor (in this case we assume this is Alice)
      operations // We provide parsed operations as second argument
    )
    .signAndSend(ALICE)
}

main()
  .then(() => process.exit())
  .catch(console.error)
