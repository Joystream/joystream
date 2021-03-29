import { ApiPromise, Keyring } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult, AnyJson } from '@polkadot/types/types/'
import { AccountId, EventRecord } from '@polkadot/types/interfaces'
import { DispatchError, DispatchResult } from '@polkadot/types/interfaces/system'
import { TypeRegistry } from '@polkadot/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { Debugger, extendDebug } from './Debugger'
import AsyncLock from 'async-lock'
import { assert } from 'chai'

export enum LogLevel {
  None,
  Debug,
  Verbose,
}

export class Sender {
  private readonly api: ApiPromise
  private static readonly asyncLock: AsyncLock = new AsyncLock()
  private readonly keyring: Keyring
  private readonly debug: Debugger.Debugger
  private logs: LogLevel = LogLevel.None
  private static instance = 0

  constructor(api: ApiPromise, keyring: Keyring, label: string) {
    this.api = api
    this.keyring = keyring
    this.debug = extendDebug(`sender:${Sender.instance++}:${label}`)
  }

  // Synchronize all sending of transactions into mempool, so we can always safely read
  // the next account nonce taking mempool into account. This is safe as long as all sending of transactions
  // from same account occurs in the same process. Returns a promise of the Extrinsic Dispatch Result ISubmittableResult.
  // The promise resolves on tx finalization (For both Dispatch success and failure)
  // The promise is rejected if transaction is rejected by node.

  public setLogLevel(level: LogLevel): void {
    this.logs = level
  }

  public async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    account: AccountId | string
  ): Promise<ISubmittableResult> {
    const addr = this.keyring.encodeAddress(account)
    const senderKeyPair: KeyringPair = this.keyring.getPair(addr)

    let finalized: { (result: ISubmittableResult): void }
    const whenFinalized: Promise<ISubmittableResult> = new Promise(async (resolve, reject) => {
      finalized = resolve
    })

    // saved human representation of the signed tx, will be set before it is submitted.
    // On error it is logged to help in debugging.
    let sentTx: AnyJson

    const handleEvents = (result: ISubmittableResult) => {
      if (result.status.isFuture) {
        // Its virtually impossible for us to continue with tests
        // when this occurs and we don't expect the tests to handle this correctly
        // so just abort!
        console.error('Future Tx, aborting!')
        process.exit(-1)
      }

      if (!result.status.isInBlock) {
        return
      }

      const success = result.findRecord('system', 'ExtrinsicSuccess')
      const failed = result.findRecord('system', 'ExtrinsicFailed')

      // Log failed transactions
      if (this.logs === LogLevel.Debug || this.logs === LogLevel.Verbose) {
        if (failed) {
          const record = failed as EventRecord
          assert(record)
          const {
            event: { data },
          } = record
          const err = data[0] as DispatchError
          if (err.isModule) {
            const { name } = (this.api.registry as TypeRegistry).findMetaError(err.asModule)
            this.debug('Dispatch Error:', name, sentTx)
          } else {
            this.debug('Dispatch Error:', sentTx)
          }
        } else {
          assert(success)
          const sudid = result.findRecord('sudo', 'Sudid')
          if (sudid) {
            const dispatchResult = sudid.event.data[0] as DispatchResult
            assert(dispatchResult)
            if (dispatchResult.isError) {
              const err = dispatchResult.asError
              if (err.isModule) {
                const { name } = (this.api.registry as TypeRegistry).findMetaError(err.asModule)
                this.debug('Sudo Dispatch Failed', name, sentTx)
              } else {
                this.debug('Sudo Dispatch Failed', sentTx)
              }
            }
          }
        }
      }

      // Always resolve irrespective of success or failure. Error handling should
      // be dealt with by caller.
      if (success || failed) finalized(result)
    }

    // We used to do this: Sender.asyncLock.acquire(`${senderKeyPair.address}` ...
    // Instead use a single lock for all calls, to force all transactions to be submitted in same order
    // of call to signAndSend. Otherwise it raises chance of race conditions.
    // It happens in rare cases and has lead some tests to fail occasionally in the past
    await Sender.asyncLock.acquire('tx-queue', async () => {
      const nonce = await this.api.rpc.system.accountNextIndex(senderKeyPair.address)
      const signedTx = tx.sign(senderKeyPair, { nonce })
      sentTx = signedTx.toHuman()
      const { method, section } = signedTx.method
      try {
        await signedTx.send(handleEvents)
        if (this.logs === LogLevel.Verbose) {
          this.debug('Submitted tx:', `${section}.${method}`)
        }
      } catch (err) {
        if (this.logs === LogLevel.Debug) {
          this.debug('Submitting tx failed:', sentTx, err)
        }
        throw err
      }
    })

    return whenFinalized
  }
}
