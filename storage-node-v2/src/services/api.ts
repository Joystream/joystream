import { ApiPromise, WsProvider } from '@polkadot/api'
import { RegistryTypes } from '@polkadot/types/types'
import { types } from '@joystream/types/'
import { Keyring } from '@polkadot/api'

export async function joystreamApiTestQuery() {
  try {
    let api = await createApi()
    console.log(api.genesisHash.toHex())
    const memberId = 0

    let profile = await api.query.members.membershipById(memberId)
    console.log(profile)
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}

export async function createStorageBucket(
  invitedWorker: number | null = null,
  allowedNewBags: boolean = true,
  sizeLimit: number = 0,
  objectsLimit: number = 0
): Promise<void> {
  try {
    let api = await createApi()

    const keyring = new Keyring({ type: 'sr25519' })
    const alice = keyring.addFromUri('//Alice')

    let invitedWorkerValue: any = api.createType(
      'Option<WorkerId>',
      invitedWorker
    )

    const txHash = await api.tx.storage
      .createStorageBucket(
        invitedWorkerValue,
        allowedNewBags,
        sizeLimit,
        objectsLimit
      )
      .signAndSend(alice)

    // Show the hash
    console.log(`Submitted with hash ${txHash}`)
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}

async function createApi() {
  const wsProvider = new WsProvider('ws://localhost:9944')
  let extendedTypes = createExtendedTypes(types)

  return await ApiPromise.create({ provider: wsProvider, types: extendedTypes })
}

function createExtendedTypes(defaultTypes: RegistryTypes) {
  let extendedTypes = types
  extendedTypes.StorageBucketId = {}
  extendedTypes.BagId = {}
  extendedTypes.UploadParameters = {}
  extendedTypes.DynamicBagId = {}
  extendedTypes.StorageBucketsPerBagValueConstraint = {}
  extendedTypes.Voucher = {}
  extendedTypes.DynamicBagType = {}
  extendedTypes.DynamicBagCreationPolicy = {}
  extendedTypes.DataObjectId = {}
  extendedTypes.DynamicBag = {}
  extendedTypes.StaticBag = {}
  extendedTypes.StaticBag = {}
  extendedTypes.StaticBagId = {}
  extendedTypes.StorageBucket = {}

  return extendedTypes
}
