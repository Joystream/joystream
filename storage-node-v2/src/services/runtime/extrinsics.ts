import { sendAndFollowSudoNamedTx, sendAndFollowNamedTx } from './api'
import { getAlicePair } from './accounts'
import { KeyringPair } from '@polkadot/keyring/types'
import { CodecArg } from '@polkadot/types/types'
import { ApiPromise } from '@polkadot/api'
import { BagId, DynamicBagType } from '@joystream/types/storage'
import logger from '../../services/logger'

/**
 * Creates storage bucket.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param invitedWorker - defines whether the storage provider should be
 * invited on the bucket creation (optional)
 * @param allowedNewBags - bucket allows new bag assignments
 * @param sizeLimit - size limit in bytes for the new bucket (default 0)
 * @param objectsLimit - object number limit for the new bucket (default 0)
 * @returns promise with a success flag.
 */
export async function createStorageBucket(
  api: ApiPromise,
  account: KeyringPair,
  invitedWorker: number | null = null,
  allowedNewBags = true,
  sizeLimit = 0,
  objectsLimit = 0
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const invitedWorkerValue = api.createType('Option<WorkerId>', invitedWorker)

    return sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'createStorageBucket',
      [invitedWorkerValue, allowedNewBags, sizeLimit, objectsLimit]
    )
  })
}

/**
 * Accepts the storage provider invitation for a bucket.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param workerId - runtime storage provider ID (worker ID)
 * @param storageBucketId - runtime storage bucket ID
 * @returns promise with a success flag.
 */
export async function acceptStorageBucketInvitation(
  api: ApiPromise,
  account: KeyringPair,
  workerId: number,
  storageBucketId: number
): Promise<boolean> {
  return await extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'acceptStorageBucketInvitation',
      [workerId, storageBucketId]
    )
  )
}

/**
 * Updates storage bucket to bags relationships.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param bagId - BagId instance
 * @param account - KeyringPair instance
 * @param bucketId - runtime storage bucket ID
 * @param removeBucket - defines whether to remove bucket. If set to false
 * the bucket will be added instead.
 * @returns promise with a success flag.
 */
export async function updateStorageBucketsForBag(
  api: ApiPromise,
  bagId: BagId,
  account: KeyringPair,
  bucketId: number,
  removeBucket: boolean
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    let addBuckets: CodecArg
    let removeBuckets: CodecArg

    if (removeBucket) {
      removeBuckets = api.createType('StorageBucketIdSet', [bucketId])
    } else {
      addBuckets = api.createType('StorageBucketIdSet', [bucketId])
    }

    return sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateStorageBucketsForBag',
      [bagId, addBuckets, removeBuckets]
    )
  })
}

/**
 * Uploads a data object info.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param objectSize - object size in bytes
 * @param objectCid - object CID (Content ID - multihash)
 * @returns promise with a success flag.
 */
export async function uploadDataObjects(
  api: ApiPromise,
  objectSize: number,
  objectCid: string
): Promise<boolean> {
  return await extrinsicWrapper(() => {
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

    return sendAndFollowSudoNamedTx(
      api,
      alice,
      'storage',
      'sudoUploadDataObjects',
      [data]
    )
  })
}

/**
 * Accepts pending data objects by storage provider.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param bagId - BagId instance
 * @param account - KeyringPair instance
 * @param workerId - runtime storage provider ID (worker ID)
 * @param storageBucketId - runtime storage bucket ID
 * @param dataObjects - runtime data objects IDs
 * @returns promise with a success flag.
 */
export async function acceptPendingDataObjects(
  api: ApiPromise,
  bagId: BagId,
  account: KeyringPair,
  workerId: number,
  storageBucketId: number,
  dataObjects: number[]
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const dataObjectSet: CodecArg = api.createType(
      'DataObjectIdSet',
      dataObjects
    )

    return sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'acceptPendingDataObjects',
      [workerId, storageBucketId, bagId, dataObjectSet]
    )
  }, true)
}

/**
 * Updates a 'StorageBucketsPerBag' limit.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param bagId - BagId instance
 * @param newLimit - new limit
 * @returns promise with a success flag.
 */
export async function updateStorageBucketsPerBagLimit(
  api: ApiPromise,
  account: KeyringPair,
  newLimit: number
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateStorageBucketsPerBagLimit',
      [newLimit]
    )
  )
}

/**
 * Updates a 'StorageBucketsVoucherMaxLimits' variables.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param bagId - BagId instance
 * @param newSizeLimit - new size limit
 * @param newObjectLimit - new object limit
 * @returns promise with a success flag.
 */
export async function updateStorageBucketsVoucherMaxLimits(
  api: ApiPromise,
  account: KeyringPair,
  newSizeLimit: number,
  newObjectLimit: number
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateStorageBucketsVoucherMaxLimits',
      [newSizeLimit, newObjectLimit]
    )
  )
}

/**
 * Deletes a storage bucket.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param bucketId - runtime storage bucket ID
 * @returns promise with a success flag.
 */
export async function deleteStorageBucket(
  api: ApiPromise,
  account: KeyringPair,
  bucketId: number
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(api, account, 'storage', 'deleteStorageBucket', [
      bucketId,
    ])
  )
}

/**
 * Invites a storage provider for a bucket.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param bucketId - runtime storage bucket ID
 * @param operatorId - runtime storage operator ID (worker ID)
 * @returns promise with a success flag.
 */
export async function inviteStorageBucketOperator(
  api: ApiPromise,
  account: KeyringPair,
  bucketId: number,
  operatorId: number
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'inviteStorageBucketOperator',
      [bucketId, operatorId]
    )
  )
}

/**
 * Helper-function. It catches the error, logs it and returns a success flag.
 *
 * @param extrinsic - extrinsic promise
 * @param throwErr - disables the default error catch and rethrows an error
 * after logging.
 * @returns promise with a success flag.
 */
async function extrinsicWrapper(
  extrinsic: () => Promise<void>,
  throwErr = false
): Promise<boolean> {
  try {
    await extrinsic()
  } catch (err) {
    logger.error(`Api Error: ${err}`)

    if (throwErr) {
      throw err
    }
    return false
  }

  return true
}

/**
 * Cancels the invite for the storage provider.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param bucketId - runtime storage bucket ID
 * @returns promise with a success flag.
 */
export async function cancelStorageBucketOperatorInvite(
  api: ApiPromise,
  account: KeyringPair,
  bucketId: number
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'cancelStorageBucketOperatorInvite',
      [bucketId]
    )
  )
}

/**
 * Removes a storage provider association with a bucket.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param bucketId - runtime storage bucket ID
 * @returns promise with a success flag.
 */
export async function removeStorageBucketOperator(
  api: ApiPromise,
  account: KeyringPair,
  bucketId: number
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'removeStorageBucketOperator',
      [bucketId]
    )
  )
}

/**
 * Updates a 'DataSizeFee' variable.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param bagId - BagId instance
 * @param fee - new fee
 * @returns promise with a success flag.
 */
export async function updateDataSizeFee(
  api: ApiPromise,
  account: KeyringPair,
  fee: number
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(api, account, 'storage', 'updateDataSizeFee', [fee])
  )
}

/**
 * Sets a metadata for the storage provider.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param operatorId - runtime storage operator ID (worker ID)
 * @param bucketId - runtime storage bucket ID
 * @param metadata - new metadata
 * @returns promise with a success flag.
 */
export async function setStorageOperatorMetadata(
  api: ApiPromise,
  account: KeyringPair,
  operatorId: number,
  bucketId: number,
  metadata: string
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'setStorageOperatorMetadata',
      [operatorId, bucketId, metadata]
    )
  )
}

/**
 * Updates the 'UploadingBlocked' variable.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param newStatus - new block status
 * @returns promise with a success flag.
 */
export async function updateUploadingBlockedStatus(
  api: ApiPromise,
  account: KeyringPair,
  newStatus: boolean
): Promise<boolean> {
  return extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateUploadingBlockedStatus',
      [newStatus]
    )
  )
}

/**
 * Updates the storage bucket status (whether it accepts new bags).
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param workerId - runtime storage provider ID (worker ID)
 * @param storageBucketId - runtime storage bucket ID
 * @param newStatus - new storage bucket status status (accepts new bag)
 * @returns promise with a success flag.
 */
export async function updateStorageBucketStatus(
  api: ApiPromise,
  account: KeyringPair,
  workerId: number,
  storageBucketId: number,
  newStatus: boolean
): Promise<boolean> {
  return await extrinsicWrapper(() =>
    sendAndFollowNamedTx(api, account, 'storage', 'updateStorageBucketStatus', [
      workerId,
      storageBucketId,
      newStatus,
    ])
  )
}

/**
 * Updates a 'StorageBucketVoucherLimits' variable for a storage bucket.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param workerId - runtime storage provider ID (worker ID)
 * @param storageBucketId - runtime storage bucket ID
 * @param newSizeLimit - new size limit
 * @param newObjectLimit - new object limit
 * @returns promise with a success flag.
 */
export async function setStorageBucketVoucherLimits(
  api: ApiPromise,
  account: KeyringPair,
  workerId: number,
  storageBucketId: number,
  newSizeLimit: number,
  newObjectLimit: number
): Promise<boolean> {
  return await extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'setStorageBucketVoucherLimits',
      [workerId, storageBucketId, newSizeLimit, newObjectLimit]
    )
  )
}

/**
 * Updates the number of storage buckets in the dynamic bag creation policy.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param dynamicBagType - dynamic bag type
 * @param newNumber - new number
 * @returns promise with a success flag.
 */
export async function updateNumberOfStorageBucketsInDynamicBagCreationPolicy(
  api: ApiPromise,
  account: KeyringPair,
  dynamicBagType: DynamicBagType,
  newNumber: number
): Promise<boolean> {
  return await extrinsicWrapper(() =>
    sendAndFollowNamedTx(
      api,
      account,
      'storage',
      'updateNumberOfStorageBucketsInDynamicBagCreationPolicy',
      [dynamicBagType, newNumber]
    )
  )
}

/**
 * Updates the blacklist for the storage.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param cid - content ID (multihash)
 * @param removeCid - defines wether the cid should be removed from the cid,
 * a cid is added when 'false'
 * @returns promise with a success flag.
 */
export async function updateBlacklist(
  api: ApiPromise,
  account: KeyringPair,
  cid: string,
  removeCid: boolean
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    let addHashes: CodecArg
    let removeHashes: CodecArg

    if (removeCid) {
      removeHashes = api.createType('ContentIdSet', [cid])
    } else {
      addHashes = api.createType('ContentIdSet', [cid])
    }

    return sendAndFollowNamedTx(api, account, 'storage', 'updateBlacklist', [
      removeHashes,
      addHashes,
    ])
  })
}
