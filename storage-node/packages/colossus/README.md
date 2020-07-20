![Storage Nodes for Joystream](../../banner.svg)

## Development

Run a development server (an ipfs node and development chain should be running on the local machine)

```bash
$ yarn colossus --dev
```

This will expect the chain to be configured with certain development accounts.
The setup can be done by running the dev-init command for the storage-cli:

```sh
yarn storage-cli dev-init
```

## Command-Line

```sh
$ yarn colossus --help
```

```
  Colossus - Joystream Storage Node

  Usage:
    $ colossus [command] [arguments]

  Commands:
    server        Runs a production server instance. (discovery and storage services)
                  This is the default command if not specified.
    discovery     Run the discovery service only.

  Arguments (required for server. Ignored if running server with --dev option):
    --provider-id ID, -i ID     StorageProviderId assigned to you in working group.
    --key-file FILE             JSON key export file to use as the storage provider (role account).
    --public-url=URL, -u URL    API Public URL to announce.

  Arguments (optional):
    --dev                   Runs server with developer settings.
    --passphrase            Optional passphrase to use to decrypt the key-file.
    --port=PORT, -p PORT    Port number to listen on, defaults to 3000.
    --ws-provider WS_URL    Joystream-node websocket provider, defaults to ws://localhost:9944
```

To run a storage server in production you will need to enroll on the network first to
obtain your provider-id and role account.

## API Packages

Since it's not entirely clear yet how APIs will develop in future, the approach
taken here is to package individual APIs up individually. That is, instead of
providing an overall API version in `api-base.yml`, it should be part of each
API package's path.

For example, for a `foo` API in its version `v1`, its definitions should live
in `./paths/foo/v1.js` and `./paths/foo/v1/*.js` respectively.

_Note:_ until a reasonably stable API is reached, this project uses a `v0`
version prefix.

## Interface/implementation

For reusability across API versions, it's best to keep files in the `paths`
subfolder very thin, and instead inject implementations via the `dependencies`
configuration value of `express-openapi`.

These implementations line to the `./lib` subfolder. Adjust `app.js` as
needed to make them available to API packages.

## Streaming Notes

For streaming content, it is required that stream metadata is located at the
start of the stream. Most software writes metadata at the end of the stream,
because it is when the stream is committed to disk that the entirety of the
metadata is known.

To move metadata to the start of the stream, a CLI tool such as
[qtfaststart](https://github.com/danielgtaylor/qtfaststart) for MP4 files might
be used.
