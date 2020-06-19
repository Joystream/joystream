const axios = require('axios')
const { Resolver } = require('./Resolver')

class JdsResolver extends Resolver {
    constructor({
        protocol = 'http', // http or https
        host = 'localhost',
        port,
        runtime
    }) {
        super({runtime})

        this.baseUrl = this.constructUrl(protocol, host, port)
    }

    async resolve(accountId) {
        const url = `${this.baseUrl}/discover/v0/${accountId}`

        // expected JSON object response
        const response = await axios.get(url)

        return response.data
    }
}

module.exports = {
    JdsResolver
}