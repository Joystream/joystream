import { KeyringPair } from '@polkadot/keyring/types'
import { u8aToHex } from '@polkadot/util'
import { signatureVerify } from '@polkadot/util-crypto'
import base64url from 'base64url'

export interface TokenRequest {
  dataObjectId: number
  storageBucketId: number
  bagId: string
}

export interface TokenBody {
  dataObjectId: number
  storageBucketId: number
  bagId: string
  timestamp: number
}

export interface Token {
  data: TokenBody
  signature: string
}

export function parseToken(tokenString: string): Token {
  return JSON.parse(base64url.decode(tokenString))
}

export function verifyTokenSignature(
  token: Token,
  account: KeyringPair
): boolean {
  const message = JSON.stringify(token.data)
  const { isValid } = signatureVerify(message, token.signature, account.address)

  return isValid
}

export function signToken(tokenBody: TokenBody, account: KeyringPair): string {
  const message = JSON.stringify(tokenBody)
  const signature = u8aToHex(account.sign(message))

  const token: Token = {
    data: tokenBody,
    signature,
  }

  return base64url.encode(JSON.stringify(token))
}

// Throws exceptions on errors.
export function verifyTokenData(token: Token, data: TokenRequest): void {
  if (token.data.dataObjectId !== data.dataObjectId) {
    throw new Error('Unexpected dataObjectId')
  }

  if (token.data.storageBucketId !== data.storageBucketId) {
    throw new Error('Unexpected storageBucketId')
  }

  if (token.data.bagId !== data.bagId) {
    throw new Error('Unexpected bagId')
  }
}
