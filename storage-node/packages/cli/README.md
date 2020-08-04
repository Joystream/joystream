# A CLI for the Joystream Runtime & Colossus

- CLI access for some functionality from other packages in the storage-node workspace
- Colossus/storage node functionality:
  - File uploads
  - File downloads
- Development
  - Setup development environment

Running the storage cli tool:

```sh
$ yarn storage-cli --help
```

```sh

  Joystream tool for uploading and downloading files to the network

  Usage:
    $ storage-cli command [arguments..] [key_file] [passphrase]

  Some commands require a key file as the last option holding the identity for
  interacting with the runtime API.

  Commands:
    upload            Upload a file to a Colossus storage node. Requires a
                      storage node URL, and a local file name to upload. As
                      an optional third parameter, you can provide a Data
                      Object Type ID - this defaults to "1" if not provided.
    download          Retrieve a file. Requires a storage node URL and a content
                      ID, as well as an output filename.
    head              Send a HEAD request for a file, and print headers.
                      Requires a storage node URL and a content ID.

  Dev Commands:       Commands to run on a development chain.
    dev-init          Setup chain with Alice as lead and storage provider.
    dev-check         Check the chain is setup with Alice as lead and storage provider.

```
