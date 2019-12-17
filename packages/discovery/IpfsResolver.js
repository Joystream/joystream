const IpfsClient = require('ipfs-http-client')
const axios = require('axios')
const { Resolver } = require('./Resolver')

class IpfsResolver extends Resolver {
    constructor({
        host = 'localhost',
        port,
        mode = 'rpc', // rpc or gateway
        protocol = 'http', // http or https
        ipfs,
        runtime
    }) {
        super({runtime})

        if (ipfs) {
            // use an existing ipfs client instance
            this.ipfs = ipfs
        } else if (mode == 'rpc') {
            port = port || '5001'
            this.ipfs = IpfsClient(host, port, { protocol })
        } else if (mode === 'gateway') {
            port = port || '8080'
            this.gateway = this.constructUrl(protocol, host, port)
        } else {
            throw new Error('Invalid IPFS Resolver options')
        }
    }

    async _resolveOverRpc(identity) {
        const ipnsPath = `/ipns/${identity}/`

        const ipfsName = await this.ipfs.name.resolve(ipnsPath, {
            recursive: false, // there should only be one indirection to service info file
            nocache: false,
        })

        const data = await this.ipfs.get(ipfsName)

        // there should only be one file published under the resolved path
        const content = data[0].content

        return JSON.parse(content)
    }

    async _resolveOverGateway(identity) {
        const url = `${this.gateway}/ipns/${identity}`

        // expected JSON object response
        const response = await axios.get(url)

        return response.data
    }

    resolve(accountId) {
        const identity = this.resolveIdentity(accountId)

        if (this.ipfs) {
            return this._resolveOverRpc(identity)
        } else {
            return this._resolveOverGateway(identity)
        }
    }
}

module.exports = {
    IpfsResolver
}