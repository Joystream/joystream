const axios = require('axios')
const debug = require('debug')('joystream:discovery:discover')
const stripEndingSlash = require('@joystream/storage-utils/stripEndingSlash')

const ipfs = require('ipfs-http-client')('localhost', '5001', { protocol: 'http' })
const BN = require('bn.js')
const { newExternallyControlledPromise } = require('@joystream/storage-utils/externalPromise')

/**
 * Determines if code is running in a browser by testing for the global window object.
 * @return {boolean} returns result check.
 */
function inBrowser() {
  return typeof window !== 'undefined'
}

/**
 * Map storage-provider id to a Promise of a discovery result. The purpose
 * is to avoid concurrent active discoveries for the same provider.
 */
const activeDiscoveries = {}

/**
 * Map of storage provider id to string
 * Cache of past discovery lookup results
 */
const accountInfoCache = {}

/**
 * After what period of time a cached record is considered stale, and would
 * trigger a re-discovery, but only if a query is made for the same provider.
 */
const CACHE_TTL = 60 * 60 * 1000

/**
 * Queries the ipns id (service key) of the storage provider from the blockchain.
 * If the storage provider is not registered it will return null.
 * @param {number | BN | u64} storageProviderId - the provider id to lookup
 * @param { RuntimeApi } runtimeApi - api instance to query the chain
 * @returns { Promise<string | null> } - ipns multiformat address
 */
async function getIpnsIdentity(storageProviderId, runtimeApi) {
  storageProviderId = new BN(storageProviderId)
  // lookup ipns identity from chain corresponding to storageProviderId
  const info = await runtimeApi.discovery.getAccountInfo(storageProviderId)

  if (info === null) {
    // no identity found on chain for account
    return null
  }
  return info.identity.toString()
}

/**
 * Resolves provider id to its service information.
 * Will use an IPFS HTTP gateway. If caller doesn't provide a url the default gateway on
 * the local ipfs node will be used.
 * If the storage provider is not registered it will throw an error
 * @param {number | BN | u64} storageProviderId - the provider id to lookup
 * @param {RuntimeApi} runtimeApi - api instance to query the chain
 * @param {string} gateway - optional ipfs http gateway url to perform ipfs queries
 * @returns { Promise<object> } - the published service information
 */
async function discoverOverIpfsHttpGateway(storageProviderId, runtimeApi, gateway = 'http://localhost:8080') {
  storageProviderId = new BN(storageProviderId)
  const isProvider = await runtimeApi.workers.isStorageProvider(storageProviderId)

  if (!isProvider) {
    throw new Error('Cannot discover non storage providers')
  }

  const identity = await getIpnsIdentity(storageProviderId, runtimeApi)

  if (identity === null) {
    // dont waste time trying to resolve if no identity was found
    throw new Error('no identity to resolve')
  }

  gateway = stripEndingSlash(gateway)

  const url = `${gateway}/ipns/${identity}`

  const response = await axios.get(url)

  return response.data
}

/**
 * Resolves id of provider to its service information.
 * Will use the provided colossus discovery api endpoint. If no api endpoint
 * is provided it attempts to use the configured endpoints from the chain.
 * If the storage provider is not registered it will throw an error
 * @param {number | BN | u64 } storageProviderId - provider id to lookup
 * @param {RuntimeApi} runtimeApi - api instance to query the chain
 * @param {string} discoverApiEndpoint - url for a colossus discovery api endpoint
 * @returns { Promise<object> } - the published service information
 */
async function discoverOverJoystreamDiscoveryService(storageProviderId, runtimeApi, discoverApiEndpoint) {
  storageProviderId = new BN(storageProviderId)
  const isProvider = await runtimeApi.workers.isStorageProvider(storageProviderId)

  if (!isProvider) {
    throw new Error('Cannot discover non storage providers')
  }

  const identity = await getIpnsIdentity(storageProviderId, runtimeApi)

  // dont waste time trying to resolve if no identity was found
  if (identity === null) {
    throw new Error('no identity to resolve')
  }

  if (!discoverApiEndpoint) {
    // Use bootstrap nodes
    const discoveryBootstrapNodes = await runtimeApi.discovery.getBootstrapEndpoints()

    if (discoveryBootstrapNodes.length) {
      discoverApiEndpoint = stripEndingSlash(discoveryBootstrapNodes[0].toString())
    } else {
      throw new Error('No known discovery bootstrap nodes found on network')
    }
  }

  const url = `${discoverApiEndpoint}/discover/v0/${storageProviderId.toNumber()}`

  // should have parsed if data was json?
  const response = await axios.get(url)

  return response.data
}

/**
 * Resolves id of provider to its service information.
 * Will use the local IPFS node over RPC interface.
 * If the storage provider is not registered it will throw an error.
 * @param {number | BN | u64 } storageProviderId - provider id to lookup
 * @param {RuntimeApi} runtimeApi - api instance to query the chain
 * @returns { Promise<object> } - the published service information
 */
async function discoverOverLocalIpfsNode(storageProviderId, runtimeApi) {
  storageProviderId = new BN(storageProviderId)
  const isProvider = await runtimeApi.workers.isStorageProvider(storageProviderId)

  if (!isProvider) {
    throw new Error('Cannot discover non storage providers')
  }

  const identity = await getIpnsIdentity(storageProviderId, runtimeApi)

  if (identity === null) {
    // dont waste time trying to resolve if no identity was found
    throw new Error('no identity to resolve')
  }

  const ipnsAddress = `/ipns/${identity}/`

  debug('resolved ipns to ipfs object')
  // Can this call hang forever!? can/should we set a timeout?
  const ipfsName = await ipfs.name.resolve(ipnsAddress, {
    // don't recurse, there should only be one indirection to the service info file
    recursive: false,
    nocache: false,
  })

  debug('getting ipfs object', ipfsName)
  const data = await ipfs.get(ipfsName) // this can sometimes hang forever!?! can we set a timeout?

  // there should only be one file published under the resolved path
  const content = data[0].content

  return JSON.parse(content)
}

/**
 * Internal method that handles concurrent discoveries and caching of results. Will
 * select the appropriate discovery protocol based on whether we are in a browser environment or not.
 * If not in a browser it expects a local ipfs node to be running.
 * @param {number | BN | u64} storageProviderId - ID of the storage provider
 * @param {RuntimeApi} runtimeApi - api instance for querying the chain
 * @returns { Promise<object | null> } - the published service information
 */
async function _discover(storageProviderId, runtimeApi) {
  storageProviderId = new BN(storageProviderId)
  const id = storageProviderId.toNumber()

  const discoveryResult = activeDiscoveries[id]
  if (discoveryResult) {
    debug('discovery in progress waiting for result for', id)
    return discoveryResult
  }

  debug('starting new discovery for', id)
  const deferredDiscovery = newExternallyControlledPromise()
  activeDiscoveries[id] = deferredDiscovery.promise

  let result
  try {
    if (inBrowser()) {
      result = await discoverOverJoystreamDiscoveryService(storageProviderId, runtimeApi)
    } else {
      result = await discoverOverLocalIpfsNode(storageProviderId, runtimeApi)
    }

    debug(result)
    result = JSON.stringify(result)
    accountInfoCache[id] = {
      value: result,
      updated: Date.now(),
    }

    deferredDiscovery.resolve(result)
    delete activeDiscoveries[id]
    return result
  } catch (err) {
    // we catch the error so we can update all callers
    // and throw again to inform the first caller.
    debug(err.message)
    delete activeDiscoveries[id]
    // deferredDiscovery.reject(err)
    deferredDiscovery.resolve(null) // resolve to null until we figure out the issue below
    // throw err // <-- throwing but this isn't being
    // caught correctly in express server! Is it because there is an uncaught promise somewhere
    // in the prior .reject() call ?
    // I've only seen this behaviour when error is from ipfs-client
    // ... is this unique to errors thrown from ipfs-client?
    // Problem is its crashing the node so just return null for now
    return null
  }
}

/**
 * Cached discovery of storage provider service information. If useCachedValue is
 * set to true, will always return the cached result if found. New discovery will be triggered
 * if record is found to be stale. If a stale record is not desired (CACHE_TTL old) pass a non zero
 * value for maxCacheAge, which will force a new discovery and return the new resolved value.
 * This method in turn calls _discovery which handles concurrent discoveries and selects the appropriate
 * protocol to perform the query.
 * If the storage provider is not registered it will resolve to null
 * @param {number | BN | u64} storageProviderId - provider to discover
 * @param {RuntimeApi} runtimeApi - api instance to query the chain
 * @param {bool} useCachedValue - optionaly use chached queries
 * @param {number} maxCacheAge - maximum age of a cached query that triggers automatic re-discovery
 * @returns { Promise<object | null> } - the published service information
 */
async function discover(storageProviderId, runtimeApi, useCachedValue = false, maxCacheAge = 0) {
  storageProviderId = new BN(storageProviderId)
  const id = storageProviderId.toNumber()
  const cached = accountInfoCache[id]

  if (cached && useCachedValue) {
    if (maxCacheAge > 0) {
      // get latest value
      if (Date.now() > cached.updated + maxCacheAge) {
        return _discover(storageProviderId, runtimeApi)
      }
    }
    // refresh if cache if stale, new value returned on next cached query
    if (Date.now() > cached.updated + CACHE_TTL) {
      _discover(storageProviderId, runtimeApi)
    }
    // return best known value
    return cached.value
  }
  return _discover(storageProviderId, runtimeApi)
}

module.exports = {
  discover,
  discoverOverJoystreamDiscoveryService,
  discoverOverIpfsHttpGateway,
  discoverOverLocalIpfsNode,
}
