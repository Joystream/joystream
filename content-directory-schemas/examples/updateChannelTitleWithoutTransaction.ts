import { ApiPromise, WsProvider } from '@polkadot/api'
import { types as joyTypes } from '@joystream/types'
import { Keyring } from '@polkadot/keyring'
// Import input parser and channel entity from @joystream/cd-schemas (we use it as library here)
import { InputParser } from '@joystream/cd-schemas'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities'
import { FlattenRelations } from '@joystream/cd-schemas/types/utility'

// Alternative way of update a channel using updateEntityPropertyValues extrinsic
async function main() {
  // Initialize the api
  const provider = new WsProvider('ws://127.0.0.1:9944')
  const api = await ApiPromise.create({ provider, types: joyTypes })

  // Get Alice keypair
  const keyring = new Keyring()
  keyring.addFromUri('//Alice', undefined, 'sr25519')
  const [ALICE] = keyring.getPairs()

  // Create partial channel entity, only containing the fields we wish to update
  const channelUpdateInput: Partial<FlattenRelations<ChannelEntity>> = {
    handle: 'Updated channel handle 2',
  }

  // Create the parser with known entity schemas (the ones in content-directory-schemas/inputs)
  const parser = InputParser.createWithKnownSchemas(api)

  // We can reuse InputParser's `findEntityIdByUniqueQuery` method to find entityId of the channel we
  // created in ./createChannelWithoutTransaction.ts example
  // (normally we would probably use some other way to do it, ie.: query node)
  const CHANNEL_ID = await parser.findEntityIdByUniqueQuery({ handle: 'Example channel 2' }, 'Channel')

  // We use parser to create input property values map
  const newPropertyValues = await parser.parseToInputEntityValuesMap(channelUpdateInput, 'Channel')

  await api.tx.contentDirectory
    .updateEntityPropertyValues(
      { Member: 0 }, // We use member with id 0 as actor (in this case we assume this is Alice)
      CHANNEL_ID,
      newPropertyValues
    )
    .signAndSend(ALICE)
}

main()
  .then(() => process.exit())
  .catch(console.error)
