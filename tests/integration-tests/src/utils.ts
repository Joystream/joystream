import { IExtrinsic } from '@polkadot/types/types'
import { compactToU8a, stringToU8a } from '@polkadot/util'
import { blake2AsHex } from '@polkadot/util-crypto'
import BN from 'bn.js'
import fs from 'fs'
import { decodeAddress } from '@polkadot/keyring'
import { Bytes } from '@polkadot/types'
import { createType } from '@joystream/types'
import { extendDebug, Debugger } from './Debugger'
import { BLOCKTIME } from './consts'
import { MetadataInput } from './types'
import { encodeDecode, metaToObject } from '@joystream/metadata-protobuf/utils'
import { AnyMetadataClass, DecodedMetadataObject } from '@joystream/metadata-protobuf/types'

export class Utils {
  private static LENGTH_ADDRESS = 32 + 1 // publicKey + prefix
  private static LENGTH_ERA = 2 // assuming mortals
  private static LENGTH_SIGNATURE = 64 // assuming ed25519 or sr25519
  private static LENGTH_VERSION = 1 // 0x80 & version

  public static calcTxLength = (extrinsic?: IExtrinsic | null, nonce?: BN): BN => {
    return new BN(
      Utils.LENGTH_VERSION +
        Utils.LENGTH_ADDRESS +
        Utils.LENGTH_SIGNATURE +
        Utils.LENGTH_ERA +
        compactToU8a(nonce || 0).length +
        (extrinsic ? extrinsic.encodedLength : 0)
    )
  }

  /** hash(accountId + salt) */
  public static hashVote(accountId: string, salt: string): string {
    const accountU8a = decodeAddress(accountId)
    const saltU8a = stringToU8a(salt)
    const voteU8a = new Uint8Array(accountU8a.length + saltU8a.length)
    voteU8a.set(accountU8a)
    voteU8a.set(saltU8a, accountU8a.length)

    const hash = blake2AsHex(voteU8a, 256)
    return hash
  }

  public static wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  public static readRuntimeFromFile(path: string): string {
    return '0x' + fs.readFileSync(path).toString('hex')
  }

  public static camelToSnakeCase(key: string): string {
    return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  }

  public static metadataToBytes<T>(metaClass: AnyMetadataClass<T>, obj: T): Bytes {
    return createType('Bytes', '0x' + Buffer.from(metaClass.encode(obj).finish()).toString('hex'))
  }

  public static metadataFromBytes<T>(metaClass: AnyMetadataClass<T>, bytes: Bytes): DecodedMetadataObject<T> {
    // We use `toObject()` to get rid of .prototype defaults for optional fields
    return metaToObject(metaClass, metaClass.decode(bytes.toU8a(true)))
  }

  public static getDeserializedMetadataFormInput<T>(
    metadataClass: AnyMetadataClass<T>,
    input: MetadataInput<T>
  ): DecodedMetadataObject<T> | null {
    if (typeof input.value === 'string') {
      try {
        return Utils.metadataFromBytes(metadataClass, createType('Bytes', input.value))
      } catch (e) {
        if (!input.expectFailure) {
          throw e
        }
        return null
      }
    }

    return encodeDecode(metadataClass, input.value)
  }

  public static getMetadataBytesFromInput<T>(metadataClass: AnyMetadataClass<T>, input: MetadataInput<T>): Bytes {
    return typeof input.value === 'string'
      ? createType('Bytes', input.value)
      : Utils.metadataToBytes(metadataClass, input.value)
  }

  public static bytesToString(b: Bytes): string {
    return (
      Buffer.from(b.toU8a(true))
        .toString()
        // eslint-disable-next-line no-control-regex
        .replace(/\u0000/g, '')
    )
  }

  public static asText(textOrHex: string): string {
    return Utils.bytesToString(createType('Bytes', textOrHex))
  }

  public static assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
      throw new Error(msg || 'Assertion failed')
    }
  }

  public static async until(
    name: string,
    conditionFunc: (props: { debug: Debugger.Debugger }) => Promise<boolean>,
    intervalMs = BLOCKTIME,
    timeoutMs = 10 * 60 * 1000
  ): Promise<void> {
    const debug = extendDebug(`awaiting:${name}`)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Awaiting ${name} - timoeut reached`)), timeoutMs)
      const check = async () => {
        if (await conditionFunc({ debug })) {
          clearInterval(interval)
          clearTimeout(timeout)
          debug('Condition satisfied!')
          resolve()
          return
        }
        debug('Condition not satisfied, waiting...')
      }
      const interval = setInterval(check, intervalMs)
      check()
    })
  }
}
