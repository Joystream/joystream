import { Keyring } from '@polkadot/api'
import { createApi, sendAndFollowNamedTx } from './api'

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
    let api = await createApi()

    const keyring = new Keyring({ type: 'sr25519' })
    const alice = keyring.addFromUri('//Alice')

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
