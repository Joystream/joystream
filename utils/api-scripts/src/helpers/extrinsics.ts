import { Keyring } from '@polkadot/keyring'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { DispatchError } from '@polkadot/types/interfaces/system'
import { TypeRegistry } from '@polkadot/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { JOYSTREAM_ADDRESS_PREFIX } from '@joystream/types'
import { sortAddresses } from '@polkadot/util-crypto'

// TODO: Move to @joystream/js soon

export function getAlicePair(): KeyringPair {
  const keyring = new Keyring({ type: 'sr25519', ss58Format: JOYSTREAM_ADDRESS_PREFIX })
  keyring.addFromUri('//Alice', { name: 'Alice' })
  const ALICE = keyring.getPairs()[0]

  return ALICE
}

export function getKeyFromSuri(suri: string): KeyringPair {
  const keyring = new Keyring({ type: 'sr25519', ss58Format: JOYSTREAM_ADDRESS_PREFIX })

  // Assume a SURI, add to keyring and return keypair
  return keyring.addFromUri(suri)
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

  async sendAndCheckMulisig(
    signers: KeyringPair[],
    keys: string[],
    tx: SubmittableExtrinsic<'promise'>,
    errorMsg?: string
  ): Promise<ISubmittableResult> {
    if (!signers.length || !keys.length) {
      throw new Error('sendAndCheckMulisig: signers.length and keys.length must be > 0')
    }
    const otherKeys = (s: KeyringPair) =>
      sortAddresses(
        keys.filter((k) => k !== s.address),
        JOYSTREAM_ADDRESS_PREFIX
      )
    if (signers.length === 1) {
      const multiTx = this.api.tx.multisig.asMultiThreshold1(otherKeys(signers[0]), tx)
      return (await this.sendAndCheck(signers[0], [multiTx], errorMsg))[0]
    }
    const maxWeight = { refTime: `${100e10}`, proofSize: '0' }
    const baseTx = this.api.tx.multisig.approveAsMulti(
      signers.length,
      otherKeys(signers[0]),
      null,
      tx.unwrap().hash,
      maxWeight
    )
    const [result] = await this.sendAndCheck(signers[0], [baseTx], errorMsg)
    const inBlockHash = result.status.asInBlock
    const inBlockBlock = (await this.api.rpc.chain.getBlock(inBlockHash)).block
    const inBlockNumber = inBlockBlock.header.number.toNumber()
    const inBlockIndex = inBlockBlock.extrinsics.findIndex((tx) => tx.hash.eq(baseTx.hash))
    const otherTxs = await Promise.all(
      signers.slice(1).map(async (s, i) => {
        const nonce = await this.nextNonce(s.address)
        if (i === signers.length - 2) {
          return this.api.tx.multisig
            .asMulti(
              signers.length,
              otherKeys(s),
              { height: inBlockNumber, index: inBlockIndex },
              tx.unwrap().toHex(),
              maxWeight
            )
            .signAsync(s, { nonce })
        } else {
          return this.api.tx.multisig
            .approveAsMulti(
              signers.length,
              otherKeys(s),
              { height: inBlockNumber, index: inBlockIndex },
              tx.unwrap().hash,
              maxWeight
            )
            .signAsync(s, { nonce })
        }
      })
    )
    const results = await this.sendAndCheckSigned(otherTxs, errorMsg)
    return results[results.length - 1]
  }

  async sendAndCheck(
    sender: KeyringPair,
    extrinsics: SubmittableExtrinsic<'promise'>[],
    errorMessage?: string
  ): Promise<ISubmittableResult[]> {
    const signedExtrinsics = await Promise.all(
      extrinsics.map(async (tx) => {
        const nonce = await this.nextNonce(sender.address)
        return tx.signAsync(sender, { nonce })
      })
    )
    return this.sendAndCheckSigned(signedExtrinsics, errorMessage)
  }

  async sendAndCheckSigned(
    extrinsics: SubmittableExtrinsic<'promise'>[],
    errorMessage?: string
  ): Promise<ISubmittableResult[]> {
    errorMessage = errorMessage || 'sendAndCheckSigned'
    const promises: Promise<ISubmittableResult>[] = []
    for (const tx of extrinsics) {
      if (!tx.isSigned) {
        throw new Error(`${errorMessage}: Extrinsic not signed!`)
      }
      promises.push(
        new Promise<ISubmittableResult>((resolve, reject) => {
          tx.send((result) => {
            let txError: string | null = null
            if (result.isError) {
              txError = `Transaction failed with status: ${result.status.type}`
              reject(new Error(`${errorMessage} - ${txError}`))
            }

            if (result.status.isInBlock) {
              result.events
                .filter(({ event }) => event.section === 'system')
                .forEach(({ event }) => {
                  if (event.method === 'ExtrinsicFailed') {
                    const dispatchError = event.data[0] as DispatchError
                    let errorMsg = dispatchError.toString()
                    if (dispatchError.isModule) {
                      try {
                        // Need to assert that registry is of TypeRegistry type, since Registry intefrace
                        // seems outdated and doesn't include DispatchErrorModule as possible argument for "findMetaError"
                        const { name, docs } = (this.api.registry as TypeRegistry).findMetaError(dispatchError.asModule)
                        errorMsg = `${name} (${docs.join(', ')})`
                      } catch (e) {
                        // This probably means we don't have this error in the metadata
                        // In this case - continue (we'll just display dispatchError.toString())
                      }
                    }
                    reject(new Error(`${errorMessage} - Extrinsic execution error: ${errorMsg}`))
                  } else if (event.method === 'ExtrinsicSuccess') {
                    resolve(result)
                  }
                })
            }
          }).catch((e: Error) => reject(new Error(`${errorMessage}: ${e.message}`)))
        })
      )
    }
    return await Promise.all(promises)
  }
}
