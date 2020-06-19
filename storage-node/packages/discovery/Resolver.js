class Resolver {
    constructor ({
        runtime
    }) {
        this.runtime = runtime
    }

    constructUrl (protocol, host, port) {
        port = port ? `:${port}` : ''
        return `${protocol}:://${host}${port}`
    }

    async resolveServiceInformation(accountId) {
        let isActor = await this.runtime.identities.isActor(accountId)

        if (!isActor) {
            throw new Error('Cannot discover non actor account service info')
        }

        const identity = await this.resolveIdentity(accountId)

        if (identity == null) {
            // dont waste time trying to resolve if no identity was found
            throw new Error('no identity to resolve');
        }

        return this.resolve(accountId)
    }

    // lookup ipns identity from chain corresponding to accountId
    // return null if no identity found or record is expired
    async resolveIdentity(accountId) {
        const info = await this.runtime.discovery.getAccountInfo(accountId)
        return info ? info.identity.toString() : null
    }
}

Resolver.Error = {};
Resolver.Error.UnrecognizedProtocol = class UnrecognizedProtocol extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnrecognizedProtocol';
    }
}

module.exports = {
    Resolver
}