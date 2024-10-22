import NodeCache from 'node-cache'

// Expiration period in seconds for the new uploads data.
// Default=3600 (1 hour)
const ExpirationPeriod = parseInt(process.env.CLEANUP_NEW_OBJECT_EXPIRATION_PERIOD || '0') || 3600

// Max ID number in local cache
const MaxEntries = 100000

// Local in-memory cache for new data objects.
const newDataObjects = new NodeCache({
  stdTTL: ExpirationPeriod,
  deleteOnExpire: true,
  maxKeys: MaxEntries,
})

/**
 * Adds a data object ID to the cache for new data objects with expiration time.
 *
 * * @param dataObjectId - data object ID.
 *
 * @returns nonce string.
 */
export function registerNewDataObjectId(dataObjectId: string): void {
  newDataObjects.set(dataObjectId, null, ExpirationPeriod)
}

/**
 * Verifies that a data object with provided ID was recently uploaded .
 *
 * @param dataObjectId - data object ID.
 * @returns true if ID was present in local cache.
 */
export function isNewDataObject(dataObjectId: string): boolean {
  return newDataObjects.has(dataObjectId)
}
