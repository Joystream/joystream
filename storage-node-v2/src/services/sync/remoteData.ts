import fetch from 'node-fetch'
import urljoin from 'url-join'
import logger from '../../services/logger'
import NodeCache from 'node-cache'

// Expiration period in seconds for the local cache.
const ExpirationPeriod: number = 5 * (60 * 1000) // minutes

// Max data entries in local cache
const MaxEntries = 10000

// Local in-memory cache for CIDs by operator URL.
const availableCidsCache = new NodeCache({
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

export async function getAvailableData(operatorUrl: string): Promise<string[]> {
  const url = urljoin(operatorUrl, 'api/v1/sync')

  const faultyOperator = badOperatorUrls.has(operatorUrl)
  if (faultyOperator) {
    logger.debug(`Sync - cached error for the ${url} skipping ....`)
    return []
  }

  const cachedData = availableCidsCache.get<string[]>(url)
  if (!!cachedData) {
    logger.debug(`Sync - getting from cache available data for ${url}`)
    return cachedData
  }

  try {
    logger.debug(`Sync - fetching available data for ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
      logger.error(
        `Sync - unexpected response for ${url}: ${response.statusText}`
      )

      return []
    }

    const data = await response.json()
    availableCidsCache.set(url, data, ExpirationPeriod)

    return data
  } catch (err) {
    logger.error(`Sync - fetching data error from ${url}: ${err}`)
    badOperatorUrls.set(operatorUrl, null, ExpirationPeriod)
  }

  return []
}
