const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' })

const debug = require('debug')('joystream:discovery:publish')

const PUBLISH_KEY = 'self' // 'services'

function bufferFrom (data) {
  return Buffer.from(JSON.stringify(data), 'utf-8')
}

function encodeServiceInfo (info) {
  return bufferFrom({
    serialized: JSON.stringify(info)
    // signature: ''
  })
}

async function publish (service_info) {
  const keys = await ipfs.key.list()
  let services_key = keys.find((key) => key.name === PUBLISH_KEY)

  // generate a new services key if not found
  if (PUBLISH_KEY !== 'self' && !services_key) {
    debug('generating ipns services key')
    services_key = await ipfs.key.gen(PUBLISH_KEY, {
      type: 'rsa',
      size: 2048
    })
  }

  if (!services_key) {
    throw new Error('No IPFS publishing key available!')
  }

  debug('adding service info file to node')
  const files = await ipfs.add(encodeServiceInfo(service_info))

  debug('publishing...')
  const published = await ipfs.name.publish(files[0].hash, {
    key: PUBLISH_KEY,
    resolve: false
    // lifetime: // string - Time duration of the record. Default: 24h
    // ttl:      // string - Time duration this record should be cached
  })

  debug(published)
  return services_key.id
}

module.exports = {
  publish
}
