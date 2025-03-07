import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { PalletStorageBagIdType as BagId, PalletStorageDynamicBagType as DynamicBagType } from '@polkadot/types/lookup'
import BN from 'bn.js'
import { timeout } from 'promise-timeout'
import logger from '../../services/logger'
import { parseBagId } from '../helpers/bagTypes'
import { AcceptPendingDataObjectsParams } from '../sync/acceptPendingObjects'
import { formatDispatchError, getEvent, getEvents, isEvent, sendAndFollowNamedTx } from './api'
import { ISubmittableResult } from '@polkadot/types/types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Call } from '@polkadot/types/interfaces'
import { Vec } from '@polkadot/types-codec'

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
    const invitedWorkerValue = api.createType('Option<u64>', invitedWorker)

    const tx = api.tx.storage.createStorageBucket(invitedWorkerValue, allowedNewBags, sizeLimit, objectsLimit)
    bucketId = await sendAndFollowNamedTx(api, account, tx, (result) => {
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
 * Updates storage buckets to bags relationships.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param bagId - List of BagIds instance
 * @param account - KeyringPair instance
 * @param add - runtime storage bucket IDs to add
 * @param remove - runtime storage bucket IDs to remove
 * @returns promise with a success flag.
 */
export async function updateStorageBucketsForBags(
  api: ApiPromise,
  bagIds: BagId[],
  account: KeyringPair,
  add: number[],
  remove: number[],
  txStrategy: 'atomic' | 'force'
): Promise<[boolean, { args: string; error: string }[] | void]> {
  // List of failed batch calls
  let failedCalls

  const success = await extrinsicWrapper(async () => {
    const removeBuckets = api.createType('BTreeSet<u64>', remove)
    const addBuckets = api.createType('BTreeSet<u64>', add)

    const batchFn = txStrategy === 'atomic' ? api.tx.utility.batchAll : api.tx.utility.forceBatch

    const txs = bagIds.map((bagId) => api.tx.storage.updateStorageBucketsForBag(bagId, addBuckets, removeBuckets))
    const txBatch = batchFn(txs)

    failedCalls = await sendAndFollowNamedTx(api, account, txBatch, (result) => {
      const batchResults = getBatchResults(txBatch, api, result)
      return batchResults.flatMap((r, i) => ('error' in r ? [{ args: txs[i].args.toString(), error: r.error }] : []))
    })
  })

  return [success, failedCalls]
}

export type ParsedBatchCallResult = { success: true } | { error: string }

/**
 * Extracts individual call results from an utility.(batch|forceBatch|batchAll)
 * extrinsic result.
 *
 * @param tx The utility.(batch|forceBatch|batchAll) extrinsic
 * @param api @polkadot/api instance
 * @param result Extrinsic result
 *
 * @returns An array of parsed results
 */
export function getBatchResults(
  tx: SubmittableExtrinsic<'promise'>,
  api: ApiPromise,
  result: ISubmittableResult
): ParsedBatchCallResult[] {
  const callsNum = (tx.args[0] as Vec<Call>).length
  let results: ParsedBatchCallResult[] = []
  for (const { event } of result.events) {
    if (isEvent(event, 'utility', 'ItemFailed')) {
      const [dispatchError] = event.data
      results.push({ error: formatDispatchError(api, dispatchError) })
    }
    if (isEvent(event, 'utility', 'ItemCompleted')) {
      results.push({ success: true })
    }
  }
  if (results.length < callsNum) {
    results = [
      ...results,
      ...Array.from({ length: callsNum - results.length }, () => ({
        error: 'Interrupted',
      })),
    ]
  }

  return results
}

/**
 * Accepts pending data objects by storage provider in batch transaction.
 *
 * @remarks
 * It sends an batch extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param workerId - runtime storage provider ID (worker ID)
 * @param acceptPendingDataObjectsParams - acceptPendingDataObject extrinsic parameters
 * @returns promise with a list of successful objects.
 */
export async function acceptPendingDataObjectsBatch(
  api: ApiPromise,
  workerId: number,
  acceptPendingDataObjectsParams: AcceptPendingDataObjectsParams[]
): Promise<string[]> {
  // a list of data objects that succeeded in being accepted
  const successDataObjects: string[] = []

  const txsByTransactorAccount = acceptPendingDataObjectsParams.map(({ account, storageBucket }) => {
    const txs = storageBucket.bags.map((bag) =>
      api.tx.storage.acceptPendingDataObjects(
        workerId,
        storageBucket.id,
        parseBagId(bag.id),
        api.createType('BTreeSet<u64>', bag.dataObjects)
      )
    )

    return [account, txs, storageBucket.bags] as const
  })

  for (const [account, txs, bags] of txsByTransactorAccount) {
    const txBatch = api.tx.utility.forceBatch(txs)

    await extrinsicWrapper(async () => {
      await sendAndFollowNamedTx(api, account, txBatch, (result) => {
        // Process individual events
        const events = getEvents(result, 'utility', ['ItemCompleted', 'ItemFailed'])
        events.forEach((e, i) => {
          if (e.method === 'ItemCompleted') {
            successDataObjects.push(...bags[i].dataObjects)
          }
        })
      })
    })
  }

  return successDataObjects
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
  storageBucketId: BN,
  dataObjects: BN[]
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const dataObjectSet = api.createType('BTreeSet<u64>', dataObjects)

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
  // 5 mins - based on the default transactions validity of Substrate based chains with
  // 6s block time: https://polkadot.js.org/docs/api/FAQ/#how-long-do-transactions-live
  timeoutMs = 300_000
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
 * Updates the 'DataSizeFee' variable.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
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
 * Updates the 'DataObjectStateBloatBondValue' variable.
 *
 * @remarks
 * It sends an extrinsic to the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @param value - new value
 * @returns promise with a success flag.
 */
export async function updateDataObjectBloatBond(
  api: ApiPromise,
  account: KeyringPair,
  value: number
): Promise<boolean> {
  return await extrinsicWrapper(() => {
    const tx = api.tx.storage.updateDataObjectStateBloatBond(value)

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
    const removeHashes = api.createType('BTreeSet<Bytes>', remove)
    const addHashes = api.createType('BTreeSet<Bytes>', add)

    const tx = api.tx.storage.updateBlacklist(removeHashes, addHashes)

    return sendAndFollowNamedTx(api, account, tx)
  })
}
