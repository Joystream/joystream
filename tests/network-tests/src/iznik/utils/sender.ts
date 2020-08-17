import BN from 'bn.js'
import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { AccountInfo } from '@polkadot/types/interfaces'
import { KeyringPair } from '@polkadot/keyring/types'
import { DbService } from '../services/dbService'

export class Sender {
  private readonly api: ApiPromise
  private db: DbService = DbService.getInstance()

  constructor(api: ApiPromise) {
    this.api = api
  }

  private async getNonce(address: string): Promise<BN> {
    const oncahinNonce: BN = (await this.api.query.system.account<AccountInfo>(address)).nonce
    let nonce: BN
    if (!this.db.hasNonce(address)) {
      nonce = oncahinNonce
    } else {
      nonce = this.db.getNonce(address)
    }
    if (oncahinNonce.gt(nonce)) {
      nonce = oncahinNonce
    }
    const nextNonce: BN = nonce.addn(1)
    this.db.setNonce(address, nextNonce)
    return nonce
  }

  private clearNonce(address: string): void {
    this.db.removeNonce(address)
  }

  public async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    account: KeyringPair,
    expectFailure = false
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const nonce: BN = await this.getNonce(account.address)
      const signedTx = tx.sign(account, { nonce })
      await signedTx
        .send(async (result) => {
          if (result.status.isInBlock && result.events !== undefined) {
            result.events.forEach((event) => {
              if (event.event.method === 'ExtrinsicFailed') {
                if (expectFailure) {
                  resolve()
                } else {
                  reject(new Error('Extrinsic failed unexpectedly'))
                }
              }
            })
            resolve()
          }
          if (result.status.isFuture) {
            console.log('nonce ' + nonce + ' for account ' + account.address + ' is in future')
            this.clearNonce(account.address)
            reject(new Error('Extrinsic nonce is in future'))
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}
