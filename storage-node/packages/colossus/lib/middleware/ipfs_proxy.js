const { createProxyMiddleware } = require('http-proxy-middleware')
const debug = require('debug')('joystream:ipfs-proxy')

/* 
For this proxying to work correctly, ensure IPFS HTTP Gateway is configured as a path gateway:
This can be done manually with the following command:

  $ ipfs config --json Gateway.PublicGateways '{"localhost": null }' 
  
The implicit default config is below which is not what we want!

  $ ipfs config --json Gateway.PublicGateways '{
    "localhost": {
        "Paths": ["/ipfs", "/ipns"],
        "UseSubdomains": true
      }
    }'

https://github.com/ipfs/go-ipfs/blob/master/docs/config.md#gateway
*/

const pathFilter = function (path, req) {
  return path.match('^/asset/v1/') && (req.method === 'GET' || req.method === 'HEAD')
}

const createPathRewriter = (resolve) => {
  return async (_path, req) => {
    const hash = await resolve(req.params.id)
    return `/ipfs/${hash}`
  }
}

const createResolver = (storage) => {
  return async (id) => await storage.resolveContentIdWithTimeout(5000, id)
}

const createProxy = (storage) => {
  const pathRewrite = createPathRewriter(createResolver(storage))

  return createProxyMiddleware(pathFilter, {
    // Default path to local IPFS HTTP GATEWAY
    target: 'http://localhost:8080/',
    pathRewrite,
    // capture redirect when IPFS HTTP Gateway is configured with 'UseDomains':true
    // and treat it as an error.
    onProxyRes: function (proxRes, _req, res) {
      if (proxRes.statusCode === 301) {
        debug('IPFS HTTP Gateway is allowing UseSubdomains. Killing stream')
        proxRes.destroy()
        // TODO: Maybe redirect - temporary to /v0/asset/contentId ?
        res.status(500).end()
      }
    },
  })
}

module.exports = {
  createProxy,
}
