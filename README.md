![Storage Nodes for Joystream](./banner.svg)

Installation
------------

*Requirements*

This project uses [yarn](https://yarnpkg.com/) as Node package manager. It also
uses some node packages with native components, so make sure to install your
system's basic build tools.

On Debian-based systems:

```bash
$ apt install build-essential
```

On Mac OS (using [homebrew](https://brew.sh/)):

```bash
$ brew install libtool automake autoconf
```

*Building*

```bash
$ yarn run build
```

The command will run `yarn install`, perform post-install fixes and build
TypeScript files.

To make the `js_storage` script available globally, run:

```bash
$ npm install -g
```

This might be best if used within e.g. an [nvm](https://github.com/creationix/nvm)
environment. *Note* that it's generally not advisable to mix `yarn` and `npm`, but
this seems safe enough.

Development
-----------

Run a development server:

```bash
$ yarn run dev --config myconfig.json
```

Run tests:
```bash
$ yarn run test
```

Run linter:
```bash
$ yarn run lint
```

TypeScript files are used for type declarations for interaction with the chain.
They are taken from [the app](https://github.com/Joystream/apps), and renamed
to suit our use:

`apps/packages/joy-members/src/types.ts` becomes `lib/joystream/types/members.ts`,
etc. The only thing adjusted in the files are the imports of other joystream
types.

`lib/joystream/types/index.js` is manually maintained, but other JavaScript
files in that folder are generated. The `update_types.sh` script can help with
keeping these in sync.

You can also switch on development mode with a configuration variable, see
below.

*Development Mode*

Development mode modifies the storage node's behaviour a little bit, but only
a little:

1. In development mode, each host discovered with the DHT will *also* be
   reported as localhost. This allows you to use the DHT resolution mechanism
   between two locally running storage nodes. Port probing will find out more
   about on what port they're running which service.

Command-Line
------------

Running a storage server is (almost) as easy as running the bundled `js_storage`
executable:

```bash
$ js_storage --storage=/path/to/storage/directory
```

Run with `--help` to see a list of available CLI options.

You need to stake as a storage provider to run a storage node.

Storage Provider Staking
------------------------

Staking for the storage provider role happens in a few simple steps:

1. Using [the app](https://github.com/Joystream/apps), create an account and make
   it a member. Make sure to save the JSON file. Not only is this account your
   identity, the file is also needed for the signup process. Make sure thea ccount
   has some currency. 
   - You need some currency to become a member.
   - You need to stake some currency to become a storage provider.
   - There's a transaction fee for applying as a storage provider.
1. Using the `js_storage` cli, run the signup process:
   ```bash
   $ js_storage signup MEMBER_ADDRESS.json
   Enter passphrase for MEMBER_ADDRESS: asdf
   Account is working for staking, proceeding.
   Generated  ROLE_ADDRESS - this is going to be exported to a JSON file.
     You can provide an empty passphrase to make starting the server easier,
     but you must keep the file very safe, then.
   Enter passphrase for ROLE_ADDRESS:
   Identity stored in ROLE_ADDRESS.json
   Funds transferred.
   Role application sent.
   ```
1. The newly created account is also saved to a JSON file. This is the account
   you use for running the storage node. Funds will be transferred from the member
   account to the role account, and an application to stake for the role will be
   created.
1. Navigate to the `Roles` menu entry of the app. If you're currently the member
   account, you should see the role application under the `MyRequests` tab.
1. Stake for the role.
1. Back with the CLI, run the server:
   ```bash
   $ js_storage --key-file ROLE_ADDRESS.json
   ```

Note that the JSON files contain the full key pair of either account. It's best
to protect them with a passphrase. If you want to run the `js_storage` server
more easily, you can also provide an empty passphrase when the JSON file is
created - but be aware that you must then take extra care to secure this file!

Configuration
-------------

Most common configuration options are available as command-line options
for the CLI.

However, some advanced configuration options are only possible to set
via the configuration file.

* `filter` is a hash of upload filtering options.
  * `max_size` sets the maximum permissible file upload size. If unset,
    this defaults to 100 MiB.
  * `mime` is a hash of...
    * `accept` is an Array of mime types that are acceptable for uploads,
      such as `text/plain`, etc. Mime types can also be specified for
      wildcard matching, such as `video/*`.
    * `reject` is an Array of mime types that are unacceptable for uploads.
* `development` is a boolean flag. See Development Mode above for details.

Upload Filtering
----------------

The upload filtering logic first tests whether any of the `accept` mime types
are matched. If none are matched, the upload is rejected. If any is matched,
then the upload is still rejected if any of the `reject` mime types are
matched.

This allows inclusive and exclusive filtering.

* `{ accept: ['text/plain', 'text/html'] }` accepts *only* the two given mime types.
* `{ accept: ['text/*'], reject: ['text/plain'] }` accepts any `text/*` that is not
  `text/plain`.

More advanced filtering is currently not available.

API Packages
------------

Since it's not entirely clear yet how APIs will develop in future, the approach
taken here is to package individual APIs up individually. That is, instead of
providing an overall API version in `api-base.yml`, it should be part of each
API package's path.

For example, for a `foo` API in its version `v1`, its definitions should live
in `./paths/foo/v1.js` and `./paths/foo/v1/*.js` respectively.

*Note:* until a reasonably stable API is reached, this project uses a `v0`
version prefix.

Interface/implementation
------------------------

For reusability across API versions, it's best to keep files in the `paths`
subfolder very thin, and instead inject implementations via the `dependencies`
configuration value of `express-openapi`.

These implementations line to the `./lib` subfolder. Adjust `server.js` as
needed to make them available to API packages.

Streaming Notes
---------------

For streaming content, it is required that stream metadata is located at the
start of the stream. Most software writes metadata at the end of the stream,
because it is when the stream is committed to disk that the entirety of the
metadata is known.

To move metadata to the start of the stream, a CLI tool such as
[qtfaststart](https://github.com/danielgtaylor/qtfaststart) for MP4 files might
be used.
