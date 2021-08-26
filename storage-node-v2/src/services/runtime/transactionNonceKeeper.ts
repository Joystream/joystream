import { KeyringPair } from '@polkadot/keyring/types'
import type { Index } from '@polkadot/types/interfaces/runtime'
import BN from 'bn.js'
import AwaitLock from 'await-lock'
import { ApiPromise } from '@polkadot/api'
import logger from '../logger'
import NodeCache from 'node-cache'

// Expiration period in seconds for the nonce cache.
const NonceExpirationPeriod = 180 // seconds

// Local in-memory cache for nonces.
const nonceCache = new NodeCache({
  stdTTL: NonceExpirationPeriod,
  deleteOnExpire: true,
})

const nonceEntryName = 'transaction_nonce'
const lock = new AwaitLock()

/**
 * Return the current transaction nonce for an account from the runtime.
 *
 * @param api - runtime API promise
 * @param account - KeyPair instance
 * @returns promise with transaction nonce for a given account.
 *
 */
export async function getTransactionNonce(
  api: ApiPromise,
  account: KeyringPair
): Promise<Index> {
  await lock.acquireAsync()
  try {
    let nonce: Index | undefined = nonceCache.get(nonceEntryName)
    if (nonce === undefined) {
      nonce = await api.rpc.system.accountNextIndex(account.address)
    } else {
      nonce = nonce.add(new BN(1)) as Index
    }

    nonceCache.set(nonceEntryName, nonce)

    logger.debug(`Last transaction nonce:${nonce}`)
    return nonce as Index
  } finally {
    lock.release()
  }
}

/**
 * Drops the transaction nonce cache.
 *
 * @returns empty promise.
 *
 */
export async function resetTransactionNonceCache(): Promise<void> {
  await lock.acquireAsync()
  nonceCache.del(nonceEntryName)

  logger.debug(`Transaction node cache was dropped.`)

  lock.release()
}
