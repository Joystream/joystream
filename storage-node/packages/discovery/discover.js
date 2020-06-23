const axios = require('axios')
const debug = require('debug')('discovery::discover')
const stripEndingSlash = require('@joystream/util/stripEndingSlash')

const ipfs = require('ipfs-http-client')('localhost', '5001', { protocol: 'http' })
const BN = require('bn.js')

function inBrowser () {
  return typeof window !== 'undefined'
}

var activeDiscoveries = {}
var accountInfoCache = {}
const CACHE_TTL = 60 * 60 * 1000

async function getIpnsIdentity (storageProviderId, runtimeApi) {
  storageProviderId = new BN(storageProviderId)
  // lookup ipns identity from chain corresponding to storageProviderId
  const info = await runtimeApi.discovery.getAccountInfo(storageProviderId)

  if (info == null) {
    // no identity found on chain for account
    return null
  } else {
    return info.identity.toString()
  }
}

async function discover_over_ipfs_http_gateway (storageProviderId, runtimeApi, gateway) {
  storageProviderId = new BN(storageProviderId)
  let isProvider = await runtimeApi.workers.isStorageProvider(storageProviderId)

  if (!isProvider) {
    throw new Error('Cannot discover non storage providers')
  }

  const identity = await getIpnsIdentity(storageProviderId, runtimeApi)

  if (identity == null) {
    // dont waste time trying to resolve if no identity was found
    throw new Error('no identity to resolve')
  }

  gateway = gateway || 'http://localhost:8080'
  gateway = stripEndingSlash(gateway)

  const url = `${gateway}/ipns/${identity}`

  const response = await axios.get(url)

  return response.data
}

async function discover_over_joystream_discovery_service (storageProviderId, runtimeApi, discoverApiEndpoint) {
  storageProviderId = new BN(storageProviderId)
  let isProvider = await runtimeApi.workers.isStorageProvider(storageProviderId)

  if (!isProvider) {
    throw new Error('Cannot discover non storage providers')
  }

  const identity = await getIpnsIdentity(storageProviderId, runtimeApi)

  if (identity == null) {
    // dont waste time trying to resolve if no identity was found
    throw new Error('no identity to resolve')
  }

  if (!discoverApiEndpoint) {
    // Use bootstrap nodes
    let discoveryBootstrapNodes = await runtimeApi.discovery.getBootstrapEndpoints()

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

async function discover_over_local_ipfs_node (storageProviderId, runtimeApi) {
  storageProviderId = new BN(storageProviderId)
  let isProvider = await runtimeApi.workers.isStorageProvider(storageProviderId)

  if (!isProvider) {
    throw new Error('Cannot discover non storage providers')
  }

  const identity = await getIpnsIdentity(storageProviderId, runtimeApi)

  if (identity == null) {
    // dont waste time trying to resolve if no identity was found
    throw new Error('no identity to resolve')
  }

  const ipns_address = `/ipns/${identity}/`

  debug('resolved ipns to ipfs object')
  let ipfs_name = await ipfs.name.resolve(ipns_address, {
    recursive: false, // there should only be one indirection to service info file
    nocache: false
  }) // this can hang forever!? can we set a timeout?

  debug('getting ipfs object', ipfs_name)
  let data = await ipfs.get(ipfs_name) // this can sometimes hang forever!?! can we set a timeout?

  // there should only be one file published under the resolved path
  let content = data[0].content

  // verify information and if 'discovery' service found
  // add it to our list of bootstrap nodes

  // TODO cache result or flag
  return JSON.parse(content)
}

async function discover (storageProviderId, runtimeApi, useCachedValue = false, maxCacheAge = 0) {
  storageProviderId = new BN(storageProviderId)
  const id = storageProviderId.toNumber()
  const cached = accountInfoCache[id]

  if (cached && useCachedValue) {
    if (maxCacheAge > 0) {
      // get latest value
      if (Date.now() > (cached.updated + maxCacheAge)) {
        return _discover(storageProviderId, runtimeApi)
      }
    }
    // refresh if cache is stale, new value returned on next cached query
    if (Date.now() > (cached.updated + CACHE_TTL)) {
      _discover(storageProviderId, runtimeApi)
    }
    // return best known value
    return cached.value
  } else {
    return _discover(storageProviderId, runtimeApi)
  }
}

function createExternallyControlledPromise () {
  let resolve, reject
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return ({ resolve, reject, promise })
}

async function _discover (storageProviderId, runtimeApi) {
  storageProviderId = new BN(storageProviderId)
  const id = storageProviderId.toNumber()

  const discoveryResult = activeDiscoveries[id]
  if (discoveryResult) {
    debug('discovery in progress waiting for result for', id)
    return discoveryResult
  }

  debug('starting new discovery for', id)
  const deferredDiscovery = createExternallyControlledPromise()
  activeDiscoveries[id] = deferredDiscovery.promise

  let result
  try {
    if (inBrowser()) {
      result = await discover_over_joystream_discovery_service(storageProviderId, runtimeApi)
    } else {
      result = await discover_over_local_ipfs_node(storageProviderId, runtimeApi)
    }

    debug(result)
    result = JSON.stringify(result)
    accountInfoCache[id] = {
      value: result,
      updated: Date.now()
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

module.exports = {
  discover,
  discover_over_joystream_discovery_service,
  discover_over_ipfs_http_gateway,
  discover_over_local_ipfs_node
}
