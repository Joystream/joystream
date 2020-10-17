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
 * A PublisherClient is used to store a JSON serializable piece of "service information" in the ipfs network
 * using the `self` key of the ipfs node. This makes looking up that information available through IPNS.
 */
class PublisherClient {
  /**
   * Create an instance of a PublisherClient, taking an optional ipfs client instance. If not provided
   * a default client using default localhost node will be used.
   * @param {IpfsClient} ipfs - optional instance of an ipfs-http-client.
   */
  constructor(ipfs) {
    this.ipfs = ipfs || require('ipfs-http-client')('localhost', '5001', { protocol: 'http' })
  }

  /**
   * Publishes the service information, encoded using the standard defined in encodeServiceInfo()
   * to ipfs, using the local ipfs node's PUBLISH_KEY, and returns the key id used to publish.
   * What we refer to as the ipns id.
   * @param {object} serviceInfo - the service information to publish
   * @return {string} - the ipns id
   */
  async publish(serviceInfo) {
    const keys = await this.ipfs.key.list()
    let servicesKey = keys.find((key) => key.name === PUBLISH_KEY)

    // An ipfs node will always have the self key.
    // If the publish key is specified as anything else and it doesn't exist
    // we create it.
    if (PUBLISH_KEY !== 'self' && !servicesKey) {
      debug('generating ipns services key')
      servicesKey = await this.ipfs.key.gen(PUBLISH_KEY, {
        type: 'rsa',
        size: 2048,
      })
    }

    if (!servicesKey) {
      throw new Error('No IPFS publishing key available!')
    }

    debug('adding service info file to node')
    const files = await this.ipfs.add(encodeServiceInfo(serviceInfo))

    debug('publishing...')
    const { name, value } = await this.ipfs.name.publish(files[0].hash, {
      key: PUBLISH_KEY,
      resolve: false,
      // lifetime: // string - Time duration of the record. Default: 24h
      // ttl:      // string - Time duration this record should be cached
    })

    debug(`published ipns name: ${name} -> ${value}`)

    // Return the key id under which the content was published. Which is used
    // to lookup the actual ipfs content id of the published service information
    // Note: name === servicesKey.id
    return servicesKey.id
  }
}

module.exports = {
  PublisherClient,
}
