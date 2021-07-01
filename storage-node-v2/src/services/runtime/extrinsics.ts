import { sendAndFollowSudoNamedTx, sendAndFollowNamedTx } from './api'
import { getAlicePair } from './accounts'
import { KeyringPair } from '@polkadot/keyring/types'
import { CodecArg } from '@polkadot/types/types'
import { ApiPromise } from '@polkadot/api'
import { BagId } from '@joystream/types/storage'
import logger from '../../services/logger'

export async function createStorageBucket(
  api: ApiPromise,
  account: KeyringPair,
  invitedWorker: number | null = null,
  allowedNewBags = true,
  sizeLimit = 0,
  objectsLimit = 0
): Promise<boolean> {
  try {
    const invitedWorkerValue = api.createType('Option<WorkerId>', invitedWorker)

    await sendAndFollowNamedTx(api, account, 'storage', 'createStorageBucket', [
      invitedWorkerValue,
      allowedNewBags,
      sizeLimit,
      objectsLimit,
    ])
  } catch (err) {
    logger.error(`Api Error: ${err}`)
    return false
  }

  return true
}

export async function acceptStorageBucketInvitation(
  api: ApiPromise,
  account: KeyringPair,
  workerId: number,
  storageBucketId: number
): Promise<boolean> {
  try {
    await sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'acceptStorageBucketInvitation',
      [workerId, storageBucketId]
    )
  } catch (err) {
    logger.error(`Api Error: ${err}`)
    return false
  }
  return true
}

export async function updateStorageBucketsForBag(
  api: ApiPromise,
  bagId: BagId,
  account: KeyringPair,
  bucketId: number,
  removeBucket: boolean
): Promise<boolean> {
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
      [bagId, addBuckets, removeBuckets]
    )
  } catch (err) {
    logger.error(`Api Error: ${err}`)
    return false
  }

  return true
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
    logger.error(`Api Error: ${err}`)
  }
}

export async function acceptPendingDataObjects(
  api: ApiPromise,
  bagId: BagId,
  account: KeyringPair,
  workerId: number,
  storageBucketId: number,
  dataObjects: number[]
): Promise<void> {
  try {
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
    logger.error(`Api Error: ${err}`)
    throw err
  }
}

export async function updateStorageBucketsPerBagLimit(
  api: ApiPromise,
  account: KeyringPair,
  newLimit: number
): Promise<boolean> {
  try {
    await sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateStorageBucketsPerBagLimit',
      [newLimit]
    )

    return true
  } catch (err) {
    logger.error(`Api Error: ${err}`)
    return false
  }
}

export async function updateStorageBucketsVoucherMaxLimits(
  api: ApiPromise,
  account: KeyringPair,
  newSizeLimit: number,
  newObjectLimit: number
): Promise<boolean> {
  try {
    await sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateStorageBucketsVoucherMaxLimits',
      [newSizeLimit, newObjectLimit]
    )
  } catch (err) {
    logger.error(`Api Error: ${err}`)
    return false
  }

  return true
}

export async function deleteStorageBucket(
  api: ApiPromise,
  account: KeyringPair,
  bucketId: number
): Promise<boolean> {
  try {
    await sendAndFollowNamedTx(api, account, 'storage', 'deleteStorageBucket', [
      bucketId,
    ])
  } catch (err) {
    logger.error(`Api Error: ${err}`)
    return false
  }

  return true
}
