const ipfsClient = require('ipfs-http-client')

const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' })

const debug = require('debug')('joystream:discovery:publish')

/**
 * The name of the key used for publishing. We use same key used by the ipfs node
 * for the network identitiy, to make it possible to identify the ipfs node of the storage
 * provider and use `ipfs ping` to check on the uptime of a particular node.
 */
const PUBLISH_KEY = 'self'

/**
 * Applies JSON serialization on the data object and converts the utf-8
 * string to a Buffer.
 * @param {object} data - json object
 * @returns {Buffer} returns buffer from UTF-8 json
 */
function bufferFrom(data) {
  return Buffer.from(JSON.stringify(data), 'utf-8')
}

/**
 * Encodes the service info into a standard format see. /storage-node/docs/json-signing.md
 * To be able to add a signature over the json data. Signing is not currently implemented.
 * @param {object} info - json object
 * @returns {Buffer} return buffer.
 */
function encodeServiceInfo(info) {
  return bufferFrom({
    serialized: JSON.stringify(info),
  })
}

/**
 * Publishes the service information, encoded using the standard defined in encodeServiceInfo()
 * to ipfs, using the local ipfs node's PUBLISH_KEY, and returns the key id used to publish.
 * What we refer to as the ipns id.
 * @param {object} serviceInfo - the service information to publish
 * @returns {string} - the ipns id
 */
async function publish(serviceInfo) {
  const keys = await ipfs.key.list()
  let servicesKey = keys.find((key) => key.name === PUBLISH_KEY)

  // An ipfs node will always have the self key.
  // If the publish key is specified as anything else and it doesn't exist
  // we create it.
  if (PUBLISH_KEY !== 'self' && !servicesKey) {
    debug('generating ipns services key')
    servicesKey = await ipfs.key.gen(PUBLISH_KEY, {
      type: 'rsa',
      size: 2048,
    })
  }

  if (!servicesKey) {
    throw new Error('No IPFS publishing key available!')
  }

  debug('adding service info file to node')
  const files = await ipfs.add(encodeServiceInfo(serviceInfo))

  debug('publishing...')
  const published = await ipfs.name.publish(files[0].hash, {
    key: PUBLISH_KEY,
    resolve: false,
    // lifetime: // string - Time duration of the record. Default: 24h
    // ttl:      // string - Time duration this record should be cached
  })

  // The name and ipfs hash of the published service information file, eg.
  // {
  //   name: 'QmUNQCkaU1TRnc1WGixqEP3Q3fazM8guSdFRsdnSJTN36A',
  //   value: '/ipfs/QmcSjtVMfDSSNYCxNAb9PxNpEigCw7h1UZ77gip3ghfbnA'
  // }
  // .. The name is equivalent to the key id that was used.
  debug(published)

  // Return the key id under which the content was published. Which is used
  // to lookup the actual ipfs content id of the published service information
  return servicesKey.id
}

module.exports = {
  publish,
}
