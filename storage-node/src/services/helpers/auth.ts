import { KeyringPair } from '@polkadot/keyring/types'
import { u8aToHex } from '@polkadot/util'
import { signatureVerify } from '@polkadot/util-crypto'
import base64url from 'base64url'
import stringify from 'fast-safe-stringify'
import { UploadToken, UploadTokenBody, UploadTokenRequest } from '../webApi/types'

/**
 * Parses upload token from the token string.
 *
 * @param tokenString - token string
 * @param bagType - dynamic bag type string
 * @returns The UploadToken instance.
 */
export function parseUploadToken(tokenString: string): UploadToken {
  return JSON.parse(base64url.decode(tokenString))
}

/**
 * Verifies UploadToken or UploadTokenRequest using its signatures.
 *
 * @param token - object to verify
 * @param address - public key(account ID)
 * @returns The UploadToken instance.
 */
export function verifyTokenSignature(token: UploadToken | UploadTokenRequest, address: string): boolean {
  const message = stringify(token.data)
  const { isValid } = signatureVerify(message, token.signature, address)

  return isValid
}

/**
 * Signs UploadToken or UploadTokenRequest.
 *
 * @param token - object to verify
 * @param account - KeyringPair instance
 * @returns object signature.
 */
export function signTokenBody(tokenBody: UploadTokenBody | UploadTokenRequest['data'], account: KeyringPair): string {
  const message = stringify(tokenBody)
  const signature = u8aToHex(account.sign(message))

  return signature
}

/**
 * Creates an upload token.
 *
 * @param tokenBody - upload token data
 * @param account - KeyringPair instance
 * @returns object signature.
 */
export function createUploadToken(tokenBody: UploadTokenBody, account: KeyringPair): string {
  const signature = signTokenBody(tokenBody, account)

  const token = {
    data: tokenBody,
    signature,
  }

  return base64url.encode(stringify(token))
}
