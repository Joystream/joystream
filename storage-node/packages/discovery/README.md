# Discovery

The `@joystream/service-discovery` package provides an API for role services to publish
discovery information about themselves, and for consumers to resolve this
information.

In the Joystream network, services are provided by having members stake for a
role. The role is identified by a worker id. Resolving service information
associated with the worker id is the main purpose of this module.

This implementation is based on [IPNS](https://docs.ipfs.io/guides/concepts/ipns/)
as well as runtime information.

## Discovery Workflow

The discovery workflow provides worker id to the `discover()` function, which
will eventually return structured data.

Under the hood, `discover()` the bootstrap nodes from the runtime are
used in a browser environment, or the local ipfs node otherwise.

There is a distinction in the discovery workflow:

1. If run in the browser environment, a HTTP request to a participating node
   is performed to discover nodes.
2. If run in a node.js process, instead:

- A trusted (local) IPFS node must be configured.
- The chain is queried to resolve a worker id to an IPNS id.
- The trusted IPFS node is used to resolve the IPNS id to an IPFS
  file.
- The IPFS file is fetched; this contains the structured data.

Web services providing the HTTP endpoint used in the first approach will
themselves use the second approach for fulfilling queries.

## Publishing Workflow

The publishing workflow is a little more involved, and requires more interaction
with the runtime and the trusted IPFS node.

1. A service information file is created.
1. The file is published on IPFS, using the IPNS self key of the local node.
1. The IPNS name of the trusted IPFS node is updated to refer to the published
   file.
1. The runtime mapping from the worker ID to the IPNS name is updated.

## Published Information

Any JSON data can theoretically be published with this system; however, the
following structure is currently imposed:

- The JSON must be an Object at the top-level, not an Array.
- Each key must correspond to a [service spec](../../docs/json-signing/README.md).

## Service Info Specifications

Service specifications are JSON Objects, not Arrays. All service specifications
come with their own `version` field which should be intepreted by clients making
use of the information.

Additionally, some services may only provide an `endpoint` value, as defined
here:

- `version`: A numeric version identifier for the service info field.
- `endpoint`: A publicly accessible base URL for a service API.

The `endpoint` should include a scheme and full authority, such that appending
`swagger.json` to the path resolves the OpenAPI definition of the API served
at this endpoint.

The OpenAPI definition must include a top level path component corresponding
to the service name, followed by an API version component. The remainder of the
provided paths are dependent on the specific version of the API provided.

For example, for an endpoint value of `https://user:password@host:port/` the
following must hold:

- `https://user:password@host:port/swagger.json` resolves to the OpenAPI
  definition of the API(s) provided by this endpoint.
- The OpenAPI definitions include paths prefixed by
  `https://user:password@host:port/XXX/vYYY` where
  - `XXX` is the service name, identical to the field name of the service spec
    in the published service information.
  - `YYY` the version identifier for the published service API.

**Note:** The `version` field in the spec indicates the version of the spec.
The `YYY` path component above indicates the version of the published OpenAPI.

### Discovery Service

Publishes `version` and `endpoint` as above; the `version` field is currently
always `1`.

### Asset Service

Publishes `version` and `endpoint` as above; the `version` field is currently
always `1`.

### Example

```json
{
  "asset": {
    "version": 1,
    "endpoint": "https://foo.bar/"
  },
  "discovery": {
    "version": 1,
    "endpoint": "http://quux.io/"
  }
}
```

Here, the following must be true:

- `https://foo.bar/swagger.json` must include paths beginning with `https://foo.bar/asset/vXXX`
  where `XXX` is the API version of the asset API.
- `https://quux.io/swagger.json` must include paths beginning with `https://foo.bar/discovery/vYYY`
  where `XXX` is the API version of the asset API.
