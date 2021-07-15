import NodeCache from 'node-cache'

export const TokenExpirationPeriod: number = 30 * 1000 // seconds
const MaxNonces = 100000

const nonceCache = new NodeCache({
  stdTTL: TokenExpirationPeriod,
  deleteOnExpire: true,
  maxKeys: MaxNonces,
})

/**
 * Creates nonce string using the high precision process time and registers
 * it in the local in-memory cache with expiration time.
 *
 * @returns nonce string.
 *
 */
export function createNonce(): string {
  const nonce = process.hrtime.bigint().toString()

  nonceCache.set(nonce, null, TokenExpirationPeriod)

  return nonce
}

/**
 * Removes the nonce from the local cache.
 *
 * @param nonce - nonce string.
 * @returns true if nonce was present in local cache.
 *
 */
export function checkRemoveNonce(nonce: string): boolean {
  const deletedEntries = nonceCache.del(nonce)

  return deletedEntries > 0
}
