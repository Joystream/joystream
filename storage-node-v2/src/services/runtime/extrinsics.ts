import {
  sendAndFollowSudoNamedTx,
  sendAndFollowNamedTx,
  getAlicePair,
} from './api'
import { KeyringPair } from '@polkadot/keyring/types'
import { CodecArg } from '@polkadot/types/types'
import { ApiPromise } from '@polkadot/api'

export async function createStorageBucket(
  api: ApiPromise,
  account: KeyringPair,
  invitedWorker: number | null = null,
  allowedNewBags = true,
  sizeLimit = 0,
  objectsLimit = 0
): Promise<void> {
  try {
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
  api: ApiPromise,
  account: KeyringPair,
  workerId: number,
  storageBucketId: number
): Promise<void> {
  try {
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

// TODO: Add dynamic bag parameter

export async function updateStorageBucketsForBag(
  api: ApiPromise,
  account: KeyringPair,
  bucketId: number,
  removeBucket: boolean
): Promise<void> {
  try {
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
  api: ApiPromise,
  objectSize: number,
  objectCid: string
): Promise<void> {
  try {
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

export async function acceptPendingDataObjects(
  api: ApiPromise,
  account: KeyringPair,
  workerId: number,
  storageBucketId: number,
  dataObjects: number[]
): Promise<void> {
  try {
    const bagId = { 'Static': 'Council' }

    const dataObjectSet: CodecArg = api.createType(
      'DataObjectIdSet',
      dataObjects
    )

    await sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'acceptPendingDataObjects',
      [workerId, storageBucketId, bagId, dataObjectSet]
    )
  } catch (err) {
    console.error(`Api Error: ${err}`)
    throw err
  }
}

export async function updateStorageBucketsPerBagLimit(
  api: ApiPromise,
  account: KeyringPair,
  newLimit: number
): Promise<void> {
  try {
    await sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateStorageBucketsPerBagLimit',
      [newLimit]
    )
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}

export async function updateStorageBucketsVoucherMaxLimits(
  api: ApiPromise,
  account: KeyringPair,
  newSizeLimit: number,
  newObjectLimit: number
): Promise<void> {
  try {
    await sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateStorageBucketsVoucherMaxLimits',
      [newSizeLimit, newObjectLimit]
    )
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}
