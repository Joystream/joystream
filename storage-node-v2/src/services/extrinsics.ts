import {
  createApi,
  sendAndFollowSudoNamedTx,
  sendAndFollowNamedTx,
  getAlicePair,
} from './runtimeApi'
import { KeyringPair } from '@polkadot/keyring/types'
import { CodecArg } from '@polkadot/types/types'

export async function createStorageBucket(
  account: KeyringPair,
  invitedWorker: number | null = null,
  allowedNewBags = true,
  sizeLimit = 0,
  objectsLimit = 0
): Promise<void> {
  try {
    const api = await createApi()

    const invitedWorkerValue = api.createType('Option<WorkerId>', invitedWorker)

    await sendAndFollowNamedTx(api, account, 'storage', 'createStorageBucket', [
      invitedWorkerValue,
      allowedNewBags,
      sizeLimit,
      objectsLimit,
    ])
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}

export async function acceptStorageBucketInvitation(
  account: KeyringPair,
  workerId: number,
  storageBucketId: number
): Promise<void> {
  try {
    const api = await createApi()

    await sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'acceptStorageBucketInvitation',
      [workerId, storageBucketId]
    )
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}

//TODO:
// export enum BagId {
//   Static = 'static',
//   Dynamic = 'dynamic',
// }

export async function updateStorageBucketsForBag(
  account: KeyringPair,
  bucketId: number,
  removeBucket: boolean
): Promise<void> {
  try {
    const api = await createApi()

    let addBuckets: CodecArg
    let removeBuckets: CodecArg

    if (removeBucket) {
      removeBuckets = api.createType('StorageBucketIdSet', [bucketId])
    } else {
      addBuckets = api.createType('StorageBucketIdSet', [bucketId])
    }

    await sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateStorageBucketsForBag',
      [{ 'Static': 'Council' }, addBuckets, removeBuckets]
    )
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}

export async function uploadDataObjects(
  objectSize: number,
  objectCid: string
): Promise<void> {
  try {
    const api = await createApi()

    const alice = getAlicePair()

    const data = api.createType('UploadParameters', {
      deletionPrizeSourceAccountId: alice.address,
      objectCreationList: [
        {
          Size: objectSize,
          IpfsContentId: objectCid,
        },
      ],
    })

    await sendAndFollowSudoNamedTx(
      api,
      alice,
      'storage',
      'sudoUploadDataObjects',
      [data]
    )
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}
