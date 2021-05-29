const { createProxyMiddleware } = require('http-proxy-middleware')
const debug = require('debug')('joystream:ipfs-proxy')
const mime = require('mime-types')

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
  // we get the full path here so it needs to match the path where
  // it is used by the openapi initializer
  return path.match('^/asset/v0') && (req.method === 'GET' || req.method === 'HEAD')
}

const createPathRewriter = () => {
  return async (_path, req) => {
    const hash = req.params.ipfs_content_id
    return `/ipfs/${hash}`
  }
}

const createProxy = (ipfsHttpGatewayUrl) => {
  const pathRewrite = createPathRewriter()

  return createProxyMiddleware(pathFilter, {
    // Default path to local IPFS HTTP GATEWAY
    target: ipfsHttpGatewayUrl || 'http://localhost:8080/',
    pathRewrite,
    onProxyRes: function (proxRes, req, res) {
      /*
        Make sure the reverse proxy used infront of colosss (nginx/caddy) Does not duplicate
        these headers to prevent some browsers getting confused especially
        with duplicate access-control-allow-origin headers!
        'accept-ranges': 'bytes',
        'access-control-allow-headers': 'Content-Type, Range, User-Agent, X-Requested-With',
        'access-control-allow-methods': 'GET',
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'Content-Range, X-Chunked-Output, X-Stream-Output',
      */

      if (proxRes.statusCode === 301) {
        // capture redirect when IPFS HTTP Gateway is configured with 'UseDomains':true
        // and treat it as an error.
        console.error('IPFS HTTP Gateway is configured for "UseSubdomains". Killing stream')
        res.status(500).end()
        proxRes.destroy()
      } else {
        // Handle downloading as attachment /asset/v0/:id?download
        if (req.query.download) {
          const contentId = req.params.id
          const contentType = proxRes.headers['content-type']
          const ext = mime.extension(contentType) || 'bin'
          const fileName = `${contentId}.${ext}`
          proxRes.headers['Content-Disposition'] = `attachment; filename=${fileName}`
        }
      }
    },
  })
}

module.exports = {
  createProxy,
}
