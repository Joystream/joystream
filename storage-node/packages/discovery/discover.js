const axios = require('axios')
const debug = require('debug')('discovery::discover')
const stripEndingSlash = require('@joystream/util/stripEndingSlash')

const ipfs = require('ipfs-http-client')('localhost', '5001', { protocol: 'http' })

function inBrowser() {
    return typeof window !== 'undefined'
}

var activeDiscoveries = {};
var accountInfoCache = {};
const CACHE_TTL = 60 * 60 * 1000;

async function getIpnsIdentity (actorAccountId, runtimeApi) {
    // lookup ipns identity from chain corresponding to actorAccountId
    const info = await runtimeApi.discovery.getAccountInfo(actorAccountId)

    if (info == null) {
        // no identity found on chain for account
        return null
    } else {
        return info.identity.toString()
    }
}

async function discover_over_ipfs_http_gateway(actorAccountId, runtimeApi, gateway) {
    let isActor = await runtimeApi.identities.isActor(actorAccountId)

    if (!isActor) {
        throw new Error('Cannot discover non actor account service info')
    }

    const identity = await getIpnsIdentity(actorAccountId, runtimeApi)

    gateway = gateway || 'http://localhost:8080'

    const url = `${gateway}/ipns/${identity}`

    const response = await axios.get(url)

    return response.data
}

async function discover_over_joystream_discovery_service(actorAccountId, runtimeApi, discoverApiEndpoint) {
    let isActor = await runtimeApi.identities.isActor(actorAccountId)

    if (!isActor) {
        throw new Error('Cannot discover non actor account service info')
    }

    const identity = await getIpnsIdentity(actorAccountId, runtimeApi)

    if (identity == null) {
        // dont waste time trying to resolve if no identity was found
        throw new Error('no identity to resolve');
    }

    if (!discoverApiEndpoint) {
        // Use bootstrap nodes
        let discoveryBootstrapNodes = await runtimeApi.discovery.getBootstrapEndpoints()

        if (discoveryBootstrapNodes.length) {
            discoverApiEndpoint = stripEndingSlash(discoveryBootstrapNodes[0].toString())
        } else {
            throw new Error('No known discovery bootstrap nodes found on network');
        }
    }

    const url = `${discoverApiEndpoint}/discover/v0/${actorAccountId}`

    // should have parsed if data was json?
    const response = await axios.get(url)

    return response.data
}

async function discover_over_local_ipfs_node(actorAccountId, runtimeApi) {
    let isActor = await runtimeApi.identities.isActor(actorAccountId)

    if (!isActor) {
        throw new Error('Cannot discover non actor account service info')
    }

    const identity = await getIpnsIdentity(actorAccountId, runtimeApi)

    const ipns_address = `/ipns/${identity}/`

    debug('resolved ipns to ipfs object')
    let ipfs_name = await ipfs.name.resolve(ipns_address, {
        recursive: false, // there should only be one indirection to service info file
        nocache: false,
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

async function discover (actorAccountId, runtimeApi, useCachedValue = false, maxCacheAge = 0) {
    const id = actorAccountId.toString();
    const cached = accountInfoCache[id];

    if (cached && useCachedValue) {
        if (maxCacheAge > 0) {
            // get latest value
            if (Date.now() > (cached.updated + maxCacheAge)) {
                return _discover(actorAccountId, runtimeApi);
            }
        }
        // refresh if cache is stale, new value returned on next cached query
        if (Date.now() > (cached.updated + CACHE_TTL)) {
            _discover(actorAccountId, runtimeApi);
        }
        // return best known value
        return cached.value;
    } else {
        return _discover(actorAccountId, runtimeApi);
    }
}

function createExternallyControlledPromise() {
    let resolve, reject;
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    return ({ resolve, reject, promise });
}

async function _discover(actorAccountId, runtimeApi) {
    const id = actorAccountId.toString();

    const discoveryResult = activeDiscoveries[id];
    if (discoveryResult) {
        debug('discovery in progress waiting for result for',id);
        return discoveryResult
    }

    debug('starting new discovery for', id);
    const deferredDiscovery = createExternallyControlledPromise();
    activeDiscoveries[id] = deferredDiscovery.promise;

    let result;
    try {
        if (inBrowser()) {
            result = await discover_over_joystream_discovery_service(actorAccountId, runtimeApi)
        } else {
            result = await discover_over_local_ipfs_node(actorAccountId, runtimeApi)
        }
        debug(result)
        result = JSON.stringify(result)
        accountInfoCache[id] = {
            value: result,
            updated: Date.now()
        };

        deferredDiscovery.resolve(result);
        delete activeDiscoveries[id];
        return result;
    } catch (err) {
        debug(err.message);
        deferredDiscovery.reject(err);
        delete activeDiscoveries[id];
        throw err;
    }
}

module.exports = {
    discover,
    discover_over_joystream_discovery_service,
    discover_over_ipfs_http_gateway,
    discover_over_local_ipfs_node,
}