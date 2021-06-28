import { KeyringPair } from '@polkadot/keyring/types'
import { stringToU8a, u8aToHex } from '@polkadot/util'
import { signatureVerify } from '@polkadot/util-crypto'

export interface TokenRequest {
  dataObjectId: number
  storageBucketId: number
  bagId: string
}

export function verifyTokenSignature(
  tokenRequest: TokenRequest,
  signature: string,
  account: KeyringPair
): boolean {
  const message = JSON.stringify(tokenRequest)
  const { isValid } = signatureVerify(message, signature, account.address)

  return isValid
}

export function signToken(
  tokenRequest: TokenRequest,
  account: KeyringPair
): string {
  const message = stringToU8a(JSON.stringify(tokenRequest))
  const signature = account.sign(message)

  return u8aToHex(signature)
}
