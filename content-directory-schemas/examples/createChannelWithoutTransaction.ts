import { ApiPromise, WsProvider } from '@polkadot/api'
import { types as joyTypes } from '@joystream/types'
import { Keyring } from '@polkadot/keyring'
// Import input parser and channel entity from @joystream/cd-schemas (we use it as library here)
import { InputParser } from '@joystream/cd-schemas'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities'
import { FlattenRelations } from '@joystream/cd-schemas/types/utility'
import { EntityId } from '@joystream/types/content-directory'

// Alternative way of creating a channel using separate extrinsics (instead of contentDirectory.transaction)
async function main() {
  // Initialize the api
  const provider = new WsProvider('ws://127.0.0.1:9944')
  const api = await ApiPromise.create({ provider, types: joyTypes })

  // Get Alice keypair
  const keyring = new Keyring()
  keyring.addFromUri('//Alice', undefined, 'sr25519')
  const [ALICE] = keyring.getPairs()

  const parser = InputParser.createWithKnownSchemas(api)

  // In this case we need to fetch some data first (like classId and language entity id)
  const classId = await parser.getClassIdByName('Channel')
  const languageEntityId = await parser.findEntityIdByUniqueQuery({ code: 'EN' }, 'Language')

  // We use FlattenRelations to exlude { new } and { existing } (which are not allowed if we want to parse only a single entity)
  const channel: FlattenRelations<ChannelEntity> = {
    handle: 'Example channel 2',
    description: 'This is an example channel',
    language: languageEntityId,
    coverPhotoUrl: '',
    avatarPhotoUrl: '',
    isPublic: true,
  }

  // In this case we use some basic callback to retrieve entityId from the extrinsc event
  const entityId = await new Promise<EntityId>((resolve, reject) => {
    api.tx.contentDirectory.createEntity(classId, { Member: 0 }).signAndSend(ALICE, {}, (res) => {
      if (res.isError) {
        reject(new Error(res.status.type))
      }
      res.events.forEach(({ event: e }) => {
        if (e.method === 'EntityCreated') {
          resolve(e.data[1] as EntityId)
        }
        if (e.method === 'ExtrinsicFailed') {
          reject(new Error('Extrinsic failed'))
        }
      })
    })
  })

  const inputPropertyValuesMap = await parser.parseToInputEntityValuesMap({ ...channel }, 'Channel')
  // Having entityId we can create and send addSchemaSupport tx
  await api.tx.contentDirectory
    .addSchemaSupportToEntity(
      { Member: 0 }, // Context (in this case we assume it's Alice's member id)
      entityId,
      0, // Schema (currently we have one schema per class, so it can be just 0)
      inputPropertyValuesMap
    )
    .signAndSend(ALICE)
}

main()
  .then(() => process.exit())
  .catch(console.error)
