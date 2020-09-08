# Summary

This package contains an abstraction over the storage backend of colossus.

In the current version, the storage is backed by IPFS. In order to run tests,
you have to also run an [IPFS node](https://dist.ipfs.io/#go-ipfs).

## Testing

Note also that tests do not finish. This is due to a design flaw in the
[IPFS HTTP Client](https://github.com/ipfs/js-ipfs-http-client/i) npm package.
In that package, requests can seemingly never time out - this client library
patches over this by using [bluebird's cancellable Promises](http://bluebirdjs.com/docs/api/cancellation.html),
so that at least this package can provide a timeout. In the client library,
however, that still leaves some dangling requests, meaning node cannot
exit cleanly.

For this reason, we're passing the `--exit` flag to `mocha` in the `test`
script - run `yarn run test` and you should have a well behaving test suite.
Run `mocha` directly, without this flag, and you may be disappointed.
