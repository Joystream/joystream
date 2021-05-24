import { createApi, sendAndFollowNamedTx, getAlicePair } from './api'

export async function createStorageBucket(
  invitedWorker: number | null = null,
  allowedNewBags = true,
  sizeLimit = 0,
  objectsLimit = 0
): Promise<void> {
  try {
    const api = await createApi()

    const alice = getAlicePair()

    const invitedWorkerValue = api.createType('Option<WorkerId>', invitedWorker)

    await sendAndFollowNamedTx(api, alice, 'storage', 'createStorageBucket', [
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
  workerId: number,
  storageBucketId: number
): Promise<void> {
  try {
    const api = await createApi()

    const alice = getAlicePair()

    await sendAndFollowNamedTx(
      api,
      alice,
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
  bucketId: number,
  removeBucket: boolean
): Promise<void> {
  try {
    const api = await createApi()

    const alice = getAlicePair()

    let addBuckets = api.createType('BTreeSet<StorageBucketId>', [bucketId])
    let removeBuckets = api.createType('BTreeSet<StorageBucketId>', [bucketId])

    if (removeBucket) {
      addBuckets = null
    } else {
      removeBuckets = null
    }

    await sendAndFollowNamedTx(
      api,
      alice,
      'storage',
      'updateStorageBucketsForBag',
      [{ 'Static': 'Council' }, addBuckets, removeBuckets]
    )
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}

export async function uploadDataObjects(objectSize: number, objectCid: string): Promise<void> {
  try {
    const api = await createApi()

    const alice = getAlicePair()

    const data = api.createType('UploadParameters', {
      deletionPrizeSourceAccountId: alice.address,
      objectCreationList: [{
        Size: objectSize,
        IpfsContentId: objectCid
      }],
    })

    await sendAndFollowNamedTx(api, alice, 'storage', 'sudoUploadDataObjects', [
      data,
    ])
  } catch (err) {
    console.error(`Api Error: ${err}`)
  }
}
