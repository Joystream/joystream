const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' })

const debug = require('debug')('joystream:discovery:publish')

/**
 * The name of the key used for publishing. We use same key used by the ipfs node
 * for the network identitiy, to make it possible to identify the ipfs node of the storage
 * provider and use `ipfs ping` to check on the uptime of a particular node.
 */
const PUBLISH_KEY = 'self'

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

  // The hash of the published service information file
  debug(published)

  // Return the key id under which the content was published. Which is used
  // to lookup the actual ipfs content id of the published service information
  return services_key.id
}

module.exports = {
  publish
}
