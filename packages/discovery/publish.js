const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' })

const debug = require('debug')('discovery::publish')

const SERVICES_KEY_NAME = 'services';

function bufferFrom(data) {
    return Buffer.from(JSON.stringify(data), 'utf-8')
}

function encodeServiceInfo(info) {
    return bufferFrom({
        serialized: JSON.stringify(info),
        // signature: ''
    })
}

async function publish (service_info) {
    const keys = await ipfs.key.list()
    let services_key = keys.find((key) => key.name === SERVICES_KEY_NAME)

    // generate a new services key if not found
    if (!services_key) {
        debug('generating ipns services key')
        services_key = await ipfs.key.gen(SERVICES_KEY_NAME, {
          type: 'rsa',
          size: 2048
        });
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
    return services_key.id;
}

module.exports = {
    publish
}
