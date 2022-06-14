import superagent from 'superagent'
import urljoin from 'url-join'
import logger from '../logger'
import NodeCache from 'node-cache'

// Expiration period in seconds for the local cache.
const ExpirationPeriod: number = 3 * 60 // minutes

// Max data entries in local cache
const MaxEntries = 10000

// Local in-memory cache for data object IDs by operator URL.
const availableIDsCache = new NodeCache({
  stdTTL: ExpirationPeriod,
  deleteOnExpire: true,
  maxKeys: MaxEntries,
})

// Local in-memory cache for faulty operator URL. Prevents fetching from the
// offline storage nodes.
const badOperatorUrls = new NodeCache({
  stdTTL: ExpirationPeriod,
  deleteOnExpire: true,
  maxKeys: MaxEntries,
})

/**
 * Queries the remote storage node for its data object IDs from the storage.
 * It caches the result (including errors) for some limited time.
 *
 * @param operatorUrl - remote storage node URL
 */
export async function getRemoteDataObjects(operatorUrl: string): Promise<string[]> {
  const url = urljoin(operatorUrl, 'api/v1/state/data-objects')

  const faultyOperator = badOperatorUrls.has(operatorUrl)
  if (faultyOperator) {
    logger.debug(`Sync - cached error for the ${url} skipping ....`)
    return []
  }

  const cachedData = availableIDsCache.get<string[]>(url)
  if (cachedData) {
    logger.debug(`Sync - getting from cache available data for ${url}`)
    return cachedData
  }

  try {
    logger.debug(`Sync - fetching available data for ${url}`)
    const timeoutMs = 120 * 1000 // 2 min
    const response = await superagent.get(url).timeout(timeoutMs)

    const data = response.body
    availableIDsCache.set(url, data, ExpirationPeriod)

    return data
  } catch (err) {
    logger.error(`Sync - fetching data error from ${url}: ${err}`)
    badOperatorUrls.set(operatorUrl, null, ExpirationPeriod)
  }

  return []
}
