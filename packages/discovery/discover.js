const axios = require('axios')
const debug = require('debug')('discovery::discover')
const AsyncLock = require('async-lock');

function inBrowser() {
    return typeof window !== 'undefined'
}

const discoveryLock = new AsyncLock();
var accountInfoCache = {};

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

    if (!discoverApiEndpoint) {
        // TODO: get from bootstrap nodes, or discovered endpoints
        discoverApiEndpoint = 'https://storage-node.joystream.org/discover/v0/'
    }

    const url = `${discoverApiEndpoint}/${actorAccountId}`

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

    var ipfs = require('ipfs-http-client')('localhost', '5001', { protocol: 'http' })

    let ipfs_name = await ipfs.name.resolve(ipns_address, {
        recursive: false, // there should only be one indirection to service info file
        nocache: false,
    })

    let data = await ipfs.get(ipfs_name)

    // there should only be one file published under the resolved path
    let content = data[0].content

    // verify information and if 'discovery' service found
    // add it to our list of bootstrap nodes

    // TODO cache result or flag
    return JSON.parse(content)
}

async function discover (actorAccountId, runtimeApi, useCachedValue = false, maxCacheAge = 0) {
    const id = actorAccountId.toString();

    return discoveryLock.acquire(id, async () => {
        const cached = accountInfoCache[id];

        if (cached && useCachedValue) {
            if (maxCacheAge) {
                if (Date.now() > (cached.updated + maxCacheAge)) {
                    return _discover(actorAccountId, runtimeApi);
                } else {
                    _discover(actorAccountId, runtimeApi);
                }
            }
            return cached.value;
        } else {
            return _discover(actorAccountId, runtimeApi);
        }
    });
}

async function _discover(actorAccountId, runtimeApi) {
    let result = null;

    try {
        if (inBrowser()) {
            result = await discover_over_joystream_discovery_service(actorAccountId, runtimeApi)
        } else {
            result = await discover_over_local_ipfs_node(actorAccountId, runtimeApi)
        }

        accountInfoCache[actorAccountId.toString()] = {
            value: JSON.stringify(result),
            updated: Date.now()
        };
    } catch (err) {
        debug(err.message);
    }

    return result;
}

module.exports = {
    discover,
    discover_over_joystream_discovery_service,
    discover_over_ipfs_http_gateway,
    discover_over_local_ipfs_node,
}