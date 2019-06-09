const ipfsClient = require('ipfs-http-client')
const debug = require('debug')('discovery::publish')

const SERVICES_KEY_NAME = 'services'
const DEFAULT_LIFETIME = 14400 // Service key shouldn't change very often

function bufferFrom(data) {
    return Buffer.from(JSON.stringify(data), 'utf-8')
}

function encodeServiceInfo(info) {
    return bufferFrom({
        serialized: JSON.stringify(info),
        // signature: ''
    })
}

async function publish (accountId, service_info, runtimeApi) {
    let isActor = await runtimeApi.identities.isActor(accountId)

    if (!isActor) {
        throw new Error('Non actor account cannot publish service info')
    }

    const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' })

    const keys = await ipfs.key.list()
    const services_key = keys.find((key) => key.name === SERVICES_KEY_NAME)

    if (!services_key) {
        throw new Error(`Expected IPNS key name ${SERVICES_KEY_NAME} not found`)
    }

    debug('adding service info file to node')
    const files = await ipfs.add(encodeServiceInfo(service_info))

    debug('publishing...')
    const published = await ipfs.name.publish(files[0].hash, {
        key: SERVICES_KEY_NAME,
        resolve: false,
        // lifetime: // string - Time duration of the record. Default: 24h
        // ttl:      // string - Time duration this record should be cached
    })

    debug(published)

    await refreshAccountInfo(accountId, services_key.id, runtimeApi)

    return published
}

async function refreshAccountInfo(accountId, keyId, runtimeApi) {
    const currentBlockHeader = await runtimeApi.api.rpc.chain.getHeader()

    // determine if we need to update onchain account
    let currentInfo = await runtimeApi.discovery.getAccountInfo(accountId)

    if (currentInfo == null ||
        // change checking blockNumber so we refresh before expiery
        currentBlockHeader.blockNumber.gt(currentInfo.expires_at) ||
        currentInfo.identity.toString() !== keyId) {
        debug('updating account info')
        return runtimeApi.discovery.setAccountInfo(accountId, keyId, DEFAULT_LIFETIME)
    }
}

module.exports = {
    publish
}
