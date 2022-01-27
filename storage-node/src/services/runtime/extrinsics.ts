import { sendAndFollowSudoNamedTx, sendAndFollowNamedTx, getEvent } from './api'
import { getAlicePair } from './accounts'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import { BagId, DynamicBagType } from '@joystream/types/storage'
import logger from '../../services/logger'
import { timeout } from 'promise-timeout'

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
 * @returns promise with a success flag and the bucket id (on success).
 */
export async function createStorageBucket(
  api: ApiPromise,
  account: KeyringPair,
  invitedWorker: number | null = null,
  allowedNewBags = true,
  sizeLimit = 0,
  objectsLimit = 0
): Promise<[boolean, number | void]> {
  let bucketId: number | void = 0
  const success = await extrinsicWrapper(async () => {
    const invitedWorkerValue = api.createType('Option<WorkerId>', invitedWorker)

    const tx = api.tx.storage.createStorageBucket(invitedWorkerValue, allowedNewBags, sizeLimit, objectsLimit)
    bucketId = await sendAndFollowNamedTx(api, account, tx, false, (result) => {
      const event = getEvent(result, 'storage', 'StorageBucketCreated')
      const bucketId = event?.data[0]

      return bucketId.toNumber()
    })
  })

  return [success, bucketId]
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
  storageBucketId: number,
  transactorAccountId: string
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.acceptStorageBucketInvitation(workerId, storageBucketId, transactorAccountId)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
 * @param add - runtime storage bucket IDs to add
 * @param remove - runtime storage bucket IDs to remove
 * @returns promise with a success flag.
 */
export async function updateStorageBucketsForBag(
  api: ApiPromise,
  bagId: BagId,
  account: KeyringPair,
  add: number[],
  remove: number[]
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const removeBuckets = api.createType('StorageBucketIdSet', remove)
    const addBuckets = api.createType('StorageBucketIdSet', add)

    const tx = api.tx.storage.updateStorageBucketsForBag(bagId, addBuckets, removeBuckets)

    return sendAndFollowNamedTx(api, account, tx)
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
 * @param dataFee - expected 'DataObjectPerMegabyteFee' runtime value
 * @returns promise with a success flag.
 */
export async function uploadDataObjects(
  api: ApiPromise,
  objectSize: number,
  objectCid: string,
  dataFee: number
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
      expectedDataSizeFee: dataFee,
    })

    const tx = api.tx.storage.sudoUploadDataObjects(data)

    return sendAndFollowSudoNamedTx(api, alice, tx)
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
    const dataObjectSet = api.createType('DataObjectIdSet', dataObjects)

    const tx = api.tx.storage.acceptPendingDataObjects(workerId, storageBucketId, bagId, dataObjectSet)

    return sendAndFollowNamedTx(api, account, tx)
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
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.updateStorageBucketsPerBagLimit(newLimit)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.updateStorageBucketsVoucherMaxLimits(newSizeLimit, newObjectLimit)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
export async function deleteStorageBucket(api: ApiPromise, account: KeyringPair, bucketId: number): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.deleteStorageBucket(bucketId)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.inviteStorageBucketOperator(bucketId, operatorId)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
  throwErr = false,
  timeoutMs = 25000 // 25s - default extrinsic timeout
): Promise<boolean> {
  try {
    await timeout(extrinsic(), timeoutMs)
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
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.cancelStorageBucketOperatorInvite(bucketId)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.removeStorageBucketOperator(bucketId)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
export async function updateDataSizeFee(api: ApiPromise, account: KeyringPair, fee: number): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.updateDataSizeFee(fee)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.setStorageOperatorMetadata(operatorId, bucketId, metadata)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.updateUploadingBlockedStatus(newStatus)

    return sendAndFollowNamedTx(api, account, tx)
  })
}

/**
 * Updates the storage bucket status (whether it accepts new bags).
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param storageBucketId - runtime storage bucket ID
 * @param newStatus - new storage bucket status status (accepts new bag)
 * @returns promise with a success flag.
 */
export async function updateStorageBucketStatus(
  api: ApiPromise,
  account: KeyringPair,
  storageBucketId: number,
  newStatus: boolean
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.updateStorageBucketStatus(storageBucketId, newStatus)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
  storageBucketId: number,
  newSizeLimit: number,
  newObjectLimit: number
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.setStorageBucketVoucherLimits(storageBucketId, newSizeLimit, newObjectLimit)

    return sendAndFollowNamedTx(api, account, tx)
  })
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
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy(dynamicBagType, newNumber)

    return sendAndFollowNamedTx(api, account, tx)
  })
}

/**
 * Updates the blacklist for the storage.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param add - content IDs (multihash) to add
 * @param remove - content IDs (multihash) to add
 * @returns promise with a success flag.
 */
export async function updateBlacklist(
  api: ApiPromise,
  account: KeyringPair,
  add: string[],
  remove: string[]
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const removeHashes = api.createType('ContentIdSet', remove)
    const addHashes = api.createType('ContentIdSet', add)

    const tx = api.tx.storage.updateBlacklist(removeHashes, addHashes)

    return sendAndFollowNamedTx(api, account, tx)
  })
}
