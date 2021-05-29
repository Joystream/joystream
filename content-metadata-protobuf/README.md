## Joystream Content Directory Metadata Library

This package contains protobuf message definitions compiled to Javascript/Typescript used for creating and updating various metadata blobs in the joystream content directory.

### Message Specs

Documented in [doc](./doc) folder

### Choice of protobuf protocol v2

For our usecase we wish to re-use same message to create and update  subset of fields.
For this reason we need the explicit information about wether a field has been set or not and this is only possible with proto v2.

Background: required/optional feilds are deprecated in [proto v3](https://www.ben-morris.com/handling-protocol-buffers-backwards-compatibility-between-versions-2-and-3-using-c/)


### Helper methods
The custom Joystream types such as License have helper methods to construct pre-defined well known values.

### Example code:

Best place to look at are the [tests specs](./test)

### Opaque types
We use simple [ISO_639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) code representation for Language.
useful npm package https://www.npmjs.com/package/iso-639-1

### Building the package

Building will compile the protofiles and build the library from source.

- pre-requisists for compiling protofiles:
    - [protoc](https://github.com/protocolbuffers/protobuf/releases)

- pre-requisists for generating documentation:
    - [golang](https://golang.org/)
    - [protoc-gen-doc](https://github.com/pseudomuto/protoc-gen-doc) to generate docs

```
yarn && yarn build
```

### Generating docs

```
yarn generate-docs
```

### Tests

```
yarn test
```