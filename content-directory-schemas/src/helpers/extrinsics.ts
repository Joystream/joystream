import { Keyring } from '@polkadot/keyring'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'

export function getAlicePair() {
  const keyring = new Keyring({ type: 'sr25519' })
  keyring.addFromUri('//Alice', { name: 'Alice' })
  const ALICE = keyring.getPairs()[0]

  return ALICE
}

export class ExtrinsicsHelper {
  api: ApiPromise
  noncesByAddress: Map<string, number>

  constructor(api: ApiPromise, initialNonces?: [string, number][]) {
    this.api = api
    this.noncesByAddress = new Map<string, number>(initialNonces)
  }

  private async nextNonce(address: string): Promise<number> {
    const nonce = this.noncesByAddress.get(address) || (await this.api.query.system.account(address)).nonce.toNumber()
    this.noncesByAddress.set(address, nonce + 1)

    return nonce
  }

  async sendAndCheck(sender: KeyringPair, extrinsics: SubmittableExtrinsic<'promise'>[], errorMessage: string) {
    const promises: Promise<void>[] = []
    for (const tx of extrinsics) {
      const nonce = await this.nextNonce(sender.address)
      promises.push(
        new Promise((resolve, reject) => {
          tx.signAndSend(sender, { nonce }, (result) => {
            if (result.isError) {
              reject(new Error(errorMessage))
            }
            if (result.status.isInBlock) {
              if (
                result.events.some(({ event }) => event.section === 'system' && event.method === 'ExtrinsicSuccess')
              ) {
                resolve()
              } else {
                reject(new Error(errorMessage))
              }
            }
          })
        })
      )
    }
    await Promise.all(promises)
  }
}
