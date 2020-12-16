import { ApiPromise, Keyring } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult, AnyJson } from '@polkadot/types/types/'
import { AccountId, EventRecord } from '@polkadot/types/interfaces'
import { DispatchError, DispatchResult } from '@polkadot/types/interfaces/system'
import { TypeRegistry } from '@polkadot/types'
import { KeyringPair } from '@polkadot/keyring/types'
import Debugger from 'debug'
import AsyncLock from 'async-lock'
import { assert } from 'chai'

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
  // from same account occurs in the same process. Returns a promise.
  // The promise resolves on successful dispatch (normal and sudo dispatches).
  // The promise is rejected undef following conditions:
  // - transaction fails to submit to node. (Encoding issues, bad signature or nonce etc.)
  // - dispatch error after the extrinsic is finalized into a block.
  // - successful sudo call (correct sudo key used) but dispatched call fails.
  public async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    account: AccountId | string
  ): Promise<ISubmittableResult> {
    const addr = this.keyring.encodeAddress(account)
    const senderKeyPair: KeyringPair = this.keyring.getPair(addr)

    let finalizedResolve: { (result: ISubmittableResult): void }
    let finalizedReject: { (err: DispatchError): void }
    const finalized: Promise<ISubmittableResult> = new Promise(async (resolve, reject) => {
      finalizedResolve = resolve
      finalizedReject = reject
    })

    // saved human representation of the signed tx, will be set before it is submitted.
    // On error it is logged to help in debugging.
    let sentTx: AnyJson

    const handleEvents = (result: ISubmittableResult) => {
      if (result.status.isFuture) {
        // Its virtually impossible for use to continue with tests
        // when this occurs and we don't expect the tests to handle this correctly
        // so just abort!
        process.exit(-1)
      }

      if (!result.status.isInBlock) {
        return
      }

      const success = result.findRecord('system', 'ExtrinsicSuccess')
      const failed = result.findRecord('system', 'ExtrinsicFailed')

      if (success) {
        const sudid = result.findRecord('sudo', 'Sudid')
        if (sudid) {
          const dispatchResult = sudid.event.data[0] as DispatchResult
          if (dispatchResult.isOk) {
            debug(`Successful Sudo Tx: ${sentTx}`)
            finalizedResolve(result)
          } else if (dispatchResult.isError) {
            const err = dispatchResult.asError
            debug(`Sudo Error: FailedTx: ${sentTx} dispatch error: ${err.toHuman()}`)
            if (err.isModule) {
              const { name, documentation } = (this.api.registry as TypeRegistry).findMetaError(err.asModule)
              debug(`${name}\n${documentation}`)
            }
            finalizedReject(err)
          } else {
            // What other result type can it be??
            assert(false)
          }
        } else {
          debug(`Successful Tx: ${sentTx}`)
          finalizedResolve(result)
        }
      } else {
        assert(failed)
        const record = failed as EventRecord
        const {
          event: { data },
        } = record
        const err = (data[0] as DispatchResult).asError // data[0] as DispatchError
        debug(`FailedTx: ${sentTx} dispatch error: ${err.toHuman()}`)
        if (err.isModule) {
          const { name, documentation } = (this.api.registry as TypeRegistry).findMetaError(err.asModule)
          debug(`${name}\n${documentation}`)
        }
        finalizedReject(err)
      }
    }

    await this.asyncLock.acquire(`${senderKeyPair.address}`, async () => {
      const nonce = await this.api.rpc.system.accountNextIndex(senderKeyPair.address)
      const signedTx = tx.sign(senderKeyPair, { nonce })
      sentTx = signedTx.toHuman()
      return signedTx.send(handleEvents)
    })

    return finalized
  }
}
