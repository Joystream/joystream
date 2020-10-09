import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { KeyringPair } from '@polkadot/keyring/types'
import Debugger from 'debug'
import AsyncLock from 'async-lock'

const debug = Debugger('sender')

export class Sender {
  private readonly api: ApiPromise
  private readonly asyncLock: AsyncLock

  // TODO: add a keyring that is shared here so no need to pass around keys

  constructor(api: ApiPromise) {
    this.api = api
    this.asyncLock = new AsyncLock()
  }

  // Synchronize all sending of transactions into mempool, so we can always safely read
  // the next account nonce taking mempool into account. This is safe as long as all sending of transactions
  // from same account occurs in the same process.
  // Returns a promise that resolves or rejects only after the extrinsic is finalized into a block.
  public async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    account: KeyringPair,
    shouldFail = false
  ): Promise<any> {
    let finalizedResolve: { (): void; (value?: any): void }
    let finalizedReject: { (arg0: Error): void; (reason?: any): void }
    const finalized = new Promise(async (resolve, reject) => {
      finalizedResolve = resolve
      finalizedReject = reject
    })

    const handleEvents = (result: ISubmittableResult) => {
      if (result.status.isInBlock && result.events !== undefined) {
        result.events.forEach((event) => {
          if (event.event.method === 'ExtrinsicFailed') {
            if (shouldFail) {
              finalizedResolve()
            } else {
              finalizedReject(new Error('Extrinsic failed unexpectedly'))
            }
          }
        })
        finalizedResolve()
      }

      if (result.status.isFuture) {
        // Its virtually impossible for use to continue with tests
        // when this occurs and we don't expect the tests to handle this correctly
        // so just abort!
        process.exit(-1)
      }
    }

    await this.asyncLock.acquire(`${account.address}`, async () => {
      const nonce = await this.api.rpc.system.accountNextIndex(account.address)
      const signedTx = tx.sign(account, { nonce })
      await signedTx.send(handleEvents)
    })

    return finalized
  }
}
