import { ApiPromise, Keyring } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { AccountId } from '@polkadot/types/interfaces'
import { KeyringPair } from '@polkadot/keyring/types'
import Debugger from 'debug'
import AsyncLock from 'async-lock'

const debug = Debugger('sender')

export class Sender {
  private readonly api: ApiPromise
  private readonly asyncLock: AsyncLock
  private readonly keyring: Keyring

  constructor(api: ApiPromise, keyring: Keyring) {
    this.api = api
    this.asyncLock = new AsyncLock()
    this.keyring = keyring
  }

  // Synchronize all sending of transactions into mempool, so we can always safely read
  // the next account nonce taking mempool into account. This is safe as long as all sending of transactions
  // from same account occurs in the same process.
  // Returns a promise that resolves or rejects only after the extrinsic is finalized into a block.
  public async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    account: AccountId | string,
    shouldFail = false
  ): Promise<ISubmittableResult> {
    const addr = this.keyring.encodeAddress(account)
    const senderKeyPair: KeyringPair = this.keyring.getPair(addr)

    let finalizedResolve: { (result: ISubmittableResult): void }
    let finalizedReject: { (err: Error): void }
    const finalized: Promise<ISubmittableResult> = new Promise(async (resolve, reject) => {
      finalizedResolve = resolve
      finalizedReject = reject
    })

    const handleEvents = (result: ISubmittableResult) => {
      if (result.status.isInBlock && result.events !== undefined) {
        result.events.forEach((event) => {
          if (event.event.method === 'ExtrinsicFailed') {
            if (shouldFail) {
              finalizedResolve(result)
            } else {
              finalizedReject(new Error('Extrinsic failed unexpectedly'))
            }
          }
        })
        finalizedResolve(result)
      }

      if (result.status.isFuture) {
        // Its virtually impossible for use to continue with tests
        // when this occurs and we don't expect the tests to handle this correctly
        // so just abort!
        process.exit(-1)
      }
    }

    await this.asyncLock.acquire(`${senderKeyPair.address}`, async () => {
      const nonce = await this.api.rpc.system.accountNextIndex(senderKeyPair.address)
      const signedTx = tx.sign(senderKeyPair, { nonce })
      await signedTx.send(handleEvents)
    })

    return finalized
  }
}
