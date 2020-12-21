import { ApiPromise, WsProvider } from '@polkadot/api'
import { types as joyTypes } from '@joystream/types'
import { Keyring } from '@polkadot/keyring'
// Import input parser and channel entity from @joystream/cd-schemas (we use it as library here)
import { InputParser } from '@joystream/cd-schemas'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities'

async function main() {
  // Initialize the api
  const provider = new WsProvider('ws://127.0.0.1:9944')
  const api = await ApiPromise.create({ provider, types: joyTypes })

  // Get Alice keypair
  const keyring = new Keyring()
  keyring.addFromUri('//Alice', undefined, 'sr25519')
  const [ALICE] = keyring.getPairs()

  const channel: ChannelEntity = {
    handle: 'Example channel',
    description: 'This is an example channel',
    // We can use "existing" syntax to reference either an on-chain entity or other entity that's part of the same batch.
    // Here we reference language that we assume was added by initialization script (initialize:dev), as it is part of
    // input/entityBatches/LanguageBatch.json
    language: { existing: { code: 'EN' } },
    coverPhotoUrl: '',
    avatarPhotoUrl: '',
    isPublic: true,
  }
  // Create the parser with known entity schemas (the ones in content-directory-schemas/inputs)
  const parser = InputParser.createWithKnownSchemas(
    api,
    // The second argument is an array of entity batches, following standard entity batch syntax ({ className, entries }):
    [
      {
        className: 'Channel',
        entries: [channel], // We could specify multiple entries here, but in this case we only need one
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
