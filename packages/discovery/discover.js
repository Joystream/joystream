const axios = require('axios')
const debug = require('debug')('discovery::discover')

function inBrowser() {
    return typeof window !== 'undefined'
}

async function getIpnsIdentity (actorAccountId, runtimeApi) {
    // lookup ipns identity from chain corresponding to actorAccountId
    const info = await runtimeApi.discovery.getAccountInfo(actorAccountId)

    if (info == null) {
        // no identity found on chain for account
        return null
    }

    // TODO: check info.expires_at > current block, otherwise return null

    // TODO: update cache

    return info.identity.toString()
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

async function discover_over_joystream_discovery_service(actorAccountId, runtimeApi, gateway) {
    // JSD will be similar to ipfs http gateway except it would only resolve
    // known actor account ids
    let isActor = await runtimeApi.identities.isActor(actorAccountId)

    if (!isActor) {
        throw new Error('Cannot discover non actor account service info')
    }
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

    // if there is endpoint information about JDS (joystream discovery service)
    // add it to our list of bootstrap nodes

    // TODO cache result or flag
    return JSON.parse(content)
}

async function discover (actorAccountId, runtimeApi) {
    if (inBrowser()) {
        return discover_over_joystream_discovery_service(actorAccountId, runtimeApi)
    } else {
        return discover_over_local_ipfs_node(actorAccountId, runtimeApi)
    }
}

module.exports = {
    discover,
    discover_over_joystream_discovery_service,
    discover_over_ipfs_http_gateway,
    discover_over_local_ipfs_node,
}