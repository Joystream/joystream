## Overview
This readme covers some basic introduction to the concept of WASM runtime, with guidelines and recommended approaches for creating, testing, and verifying runtime upgrades.

## Target audiance
This guide is targeted to developers, council members and any technical community member that wants to participate in the process of runtime upgrade of the chain.

It is expected you have some technical and coding background and some knowlege about substrate in general and joystream runtime specifically.

## Runtime Upgrade - What is it?

A key feature of the joystream network, and substrate based chains in general is the ability to perform [forkless upgrades](https://docs.substrate.io/build/upgrade-the-runtime/) of the business logic, known as the runtime. In joystream the process of performing an upgrade is managed through governance via a runtime upgrade proposal which can be created by any member, and 4 consecutive conucils must approve.

The runtime is stored on chain, at a well known storage key, as an [WebAssembly](https://docs.substrate.io/reference/glossary/#webassembly-wasm) binary, or WASM for short. The WASM is produced by building the joystream [runtime](./runtime) source code, which is made up of substrate and joystream pallets or [rutime-modules](./runtime-modules).

## WASM compression
The raw compiled WASM is averaging ~5MB. This is too large to fit in transactions and blocks. So the build process compacts the original produce WASM and finally compresses it with the [Zstandard](https://facebook.github.io/zstd/) fast compression algorithm.
Note a compressed runtime has a magic 8 byte pre-fix so to decompress we must first strip them.

You will need the `zstd` commandline tool to decompress and inspect the runtime from the chain.

On Mac:
`brew install zstd`

On Debian/Linux based distros:
`apt install zstd`

You can then decompress with following command:
`dd if=compressed.wasm bs=512k | { dd bs=8 count=1 of=/dev/null; dd bs=512k; } | zstd -d -o uncompressed.wasm`

## Getting the current runtime from the chain
From a fully synced node we can download the runtime blob and get information about it.

### Using utils/api-scripts/[get-runtime-code.ts](./utils/api-scripts/get-runtime-code.ts)

```sh
cd utils/api-scripts/
# Get runtime version information
WS_URI=wss://rpc.joystream.org yarn ts-node src/status.ts
# Fetch the runtime and save it as runtime.wasm
WS_URI=wss://rpc.joystream.org yarn ts-node src/get-runtime-code.ts ./runtime.wasm
# compute the blake2-256 hash of the runtime
b2sum -l 256 ./runtime.wasm
# Inspect the runtime version
node --experimental-wasm-bigint src/inspect-wasm-runtime-version.js ./runtime.wasm
```

### Using [subwasm](https://github.com/chevdor/subwasm)

```sh
# Install subwasm
cargo install --locked --git https://github.com/chevdor/subwasm --tag v0.18.0
# Fetch the runtime and save it as runtime.wasm
subwasm get wss://rpc.joystream.org:9944/ -o ./runtime.wasm
# Get runtime version and hash
subwasm info ./runtime.wasm
```

### From polkadot-js-app
Visit https://polkadot.js.org/apps/#/chainstate/raw and make sure you are pointing at the joystream network.

Enter storage key: `0x3a636f6465`
Copy hex string and use a tool to convert it to a binary file.

### From QueryNode 
It is best to use the approaches mentioned above as the most direct way to fetch the rutnime, but it can also be found in the query-node, if at least one runtime upgrade has been performed through governance.

```
Psuedo Code:
Get latest executed runtime upgrade proposal
From proposal details get the runtime hash
Query the runtimeCode table by hash to fetch the wasm blob
```

Reference code from [pioneer](https://github.com/Joystream/pioneer/blob/dev/packages/ui/src/proposals/hooks/useRuntimeBytecode.ts)

## Verifying runtime builds
By verification we mean that we can follow steps to get a guarantee that a specific runtime wasm blob was compiled/built from a given codebase.

For verification to be possible, it is an essential property of the build process to be [deterministic](https://docs.substrate.io/build/build-a-deterministic-runtime/).
So if independant actors build the same code with the same process, they must get the same byte-for-byte wasm blob as a result.

We have chosen the approach of using docker with a fixed version of the rust toolchain running on ubuntu amd64 architecture host to build joystream-node and runtime.

Polkadot adopts a similar approach and a generalized tool [`srtool`](https://docs.substrate.io/reference/command-line-tools/srtool/) exists for building runtimes. Perhaps we should be consider using that in future.

### Example - Verify onchain runtime
As a policy the master branch will be kept upto-date with the runtime used on mainnet
Lets verify that this is the case.

```sh
git checkout master
# Build joystream-node docker image with production runtime profile
docker build . --file joystream-node.Dockerfile --tag joystream/node:test --platform linux/amd64
```

```sh
# Extract the compressed wasm file from the built docker image
docker create --name test --platform linux/amd64 joystream/node:test
docker cp test:/joystream/runtime.compact.compressed.wasm ./master.wasm
docker rm test
```

```sh
# compute the blake2-256 hash of the runtime
b2sum -l 256 ./master.wasm
# Inspect the runtime version information
node --experimental-wasm-bigint utils/api-scripts/src/inspect-wasm-runtime-version.js ./master.wasm
```

Compare results with the runtime you fetched from the chain in previous section.

### Example - Verify a proposed runtime

If you are verifying a proposed runtime then you will need to build it yourself from what the proposer claims is the git commit/branch for the new proposed runtime, and compare it with the proposed runtime.

The proposed WASM can also be downloaded from the proposal details page in pioneer.
The hash of the propossed runtime should also be visible in pioneer. 

#### Howto fetch the proposed runtime
If you don't want to rely on pioneer,
another way to check the runtime proposed is with utility scripts provided.

For a hypothetical proposal with id `123`

```sh
cd utils/api-scripts/
# Fetch the runtime and save it as runtime.wasm
WS_URI=wss://rpc.joystream.org yarn ts-node src/get-wasm-from-proposal.ts 123 ./proposed.wasm
# compute the blake2-256 hash of the runtime
b2sum -l 256 ./proposed.wasm
# Inspect the runtime version information
node --experimental-wasm-bigint src/inspect-wasm-runtime-version.ts ./runtime.wasm
```

Checkout the proposed runtime from the proposer's fork of joystream repository, and build it.

```sh
git remote add proposer https://github.com/proposer-github-id/joystream.git
git checkout the-proposed-runtime-branch
# Build joystream-node docker image with production runtime profile
docker build . --file joystream-node.Dockerfile --tag joystream/node:test --platform linux/amd64
```

Then follow steps from previous section on how extract the wasm file from the image you just built,
and inspect its hash and version information.

#### Reviewing code changes
Verifying the proposed runtime comes from a specific code base is only the first step ofcourse.
There is no guarantee the proposed runtime is safe to use, implements changes or new features outlined by the proposer.

So we must inspect the source code changes proposed. This is done by reviewing the "diff" between the new code and the code of the current onchain runtime (which we assume is on master branch)

```sh
# Show code changes made by the new runtime
git diff master
```

Typically runtime changes will be accompanied by updates to various other packages in the joystream repo, so we can narrow down to inspect only relevant changes by looking at specific folders.

```sh
git diff master -- runtime/ runtime-modules/ bin/ Cargo.toml Cargo.lock
```

### Sharing code changes without using public repo
A proposer may choose not to make changes public, they can be shared through more secure and private channels with the council members (who ultimately vote on the runtime upgrade proposal). 

The primary case where this might be a good idea is when fixing a bug, or security issue.

#### Using a patch file
One approach would be to provide the code changes via a patch file produced from the proposers local changes. Lets say proposer has created a local branch based off master branch called fix-runtime:


```sh
git checkout fix-runtime
git diff master -- Cargo.lock Cargo.toml joystream-node.Dockerfile runtime/ runtime-modules/ bin/ > fix-runtime.patch
```

This saves the code changes in a patch or diff file named fix-runtime.patch
This should then be encrypted with council members' or other trusted community members that would be tasked with reviewing and testing the patch, and possibly providing council members with their assesment.

After decrypting the patch file it can be applied for review: 

```sh
git checkout master
git checkout -b test-fix
git apply fix-runtime.patch
git diff
```

#### Using a tarball
Alternatively all required files for building the runtime can be shared in an archive or 'tarball'

```sh
# From the root direcotry
cd $(git rev-parse --show-toplevel)
tar -czf joystream.tar.gz \
    Cargo.lock \
    Cargo.toml \
    runtime \
    runtime-modules \
    joystream-node.Dockerfile \
    bin
```

## Implementing a new runtime

### General workflow
Although how actual runtime changes are not detailed here, there is a general set of steps that should
be followed below:

#### Development cycle

  1. Determine the "base" branch to bulid pn. This will typically be the master branch.
  1. Bump the `spec_version` component of the runtime `pub const VERSION` in `runtime/src/lib.rs`
     update the version of the cargo crates (Cargo.toml) for both the runtime and bin/node
     runtime `spec_name` should not be changed.
     If the runtime change is only an performance enhancement with no new state or state logic, then
     only the `impl_version` needs to be changed.
  1. Implement runtime changes, fixes, or new feature. This must includes benchmarking code and new unit tests as appropriate.
  1. Run `yarn cargo-checks` to run the linter, code formatting check and unit tests.
  1. Build the node with runtime benchmarks feature enabled, see `./scripts/cargo-build-with-benchmarks.sh`
  1. Generate weights for modified/new benchmark functions on reference machine, and checkin the changes of the weights.rs - helper script is available in scripts/generate-weights.sh
  1. Re run code formatting with `cargo fmt --all`
  1. Do another test build with modified benchmarks `yarn cargo-checks && yarn cargo-build`
  1. Extract the new runtime metadata `yarn update-chain-metadata`
  1. Build all npm packages: `yarn build:packages`
  1. Add any new integration tests, query-node mappings that cover the changes implemented.
  1. Lint typescript `yarn lint`
  1. Build the testing runtime joystream/node docker image and run the full integration test suite (see Integration tests section below)
  1. Commit your changes and push new branch to your repo.
  1. Open a PR from your branch on upstream repo, targetting the current runtime release (master) so there is a clear code git diff showing the changes being implemented in the new runtime.

You should typically wait for community and core dev team to review before taking the next step of creating the runtime upgrade proposal, as that will require staking a substantial amount of tokens which are at risk of being slashed if the council rejects the proposal.

#### Creating the proposal
  1. Build the production joystream/node docker image.
  1. Extract the compressed wasm blob from the docker image image.
  1. Create a proposal in [pioneer](https://pioneerapp.xyz/#/proposals/current)
     Follow instructions, and provide reference to the Pull Request, and upload the compressed wasm file.
  
### General Points
Making runtime changes are very critical and there are lots of details to keep in mind, especially when the runtime is an upgrade of the current chain, as apposed to a new runtime for a genesis block.
Below are some points to watch out for, what you can/cannot do.. and work arounds.

### Consensus algorithm
No changes should be made to the block interval.

### Runtime type changes
As much as possible avoid changing the types that are stord in state storage. If changes are made there must be either accompanying migration code, or custom decoding implementation for the type to ensure reading existing state from storage does not fail to decode. Adding new types and migrating state from old types is encouraged.

Ref: guide on how migrations can be done: https://docs.substrate.io/reference/how-to-guides/storage-migrations/basic-storage-migration/

### Runtime event types
It is generally not safe to modify runtime event type. The primary consumer of events is the query node,
and the current implementation of they query node does not have a built in mechanism to correctly handle changing of the event type structure through runtime changes, and it should generally be avoided.

If absolutely necessary the graphql schema and event handler must be aware of such change and be written in a backwards compatible way.

The issue is being worked on: https://github.com/Joystream/joystream/issues/4650

### New Genesis configurable state storage
When introducing new state storage that is configurable at genesus, keep in mind that the genesis build function for the pallet will not be executed and will not be assigned. Initialing such values must be done in the `on_runtime_upgrade()` hook of the runtime.

### OnRuntimeUpgrade hook
A custom [OnRuntimeUpgrade](https://github.com/Joystream/joystream/blob/master/runtime/src/runtime_api.rs#L63) is executed once when the runtime upgrades to the new version.

This is where we can execute migration code, or any the logic such as setting new storage values if necessary.
It is important in this function to keep the invocation of`ProposalsEngine::cancel_active_and_pending_proposals()` to cancels all proposals, as there is no guarantee that the encoded calls for the proposal still reflect the original pallet, extrinsic and arguments expected. [Related issue](https://github.com/Joystream/joystream/issues/4654)

On a related note, there is a new approach seen in substrate code where the pallet id and method index can be hardcoded with rust decoration macros that can offer a better guarnatee between runtimes that encoded call would still dispatch the correct call.
This should be researched.

### Joystream fork of substrate
By inspecting Cargo.toml of runtime/, runtime-modules/ and bin/ you will note that the dependencies on substrate comes from:
https://github.com/Joystream/substrate/tree/update-carthage-to-v0.9.24-1 

It is important that the custom implementation of the vesting and staking be maintained to be compatible with joystream runtime.
  - [vesting pallet](https://github.com/Joystream/substrate/pull/7)
  - [staking bonding](https://github.com/Joystream/substrate/pull/8)

At time of writing the modifications for vesting pallet have been ported to newer versions of substrate upstream, but not the staking pallet.

This should be kept in mind when planning a runtime upgrade that also updates the core version of substrate.

### Running integration tests
The best experience for doing development and testing is on a linux/ubuntu amd64 architecture machine, especially when it comes to working with docker.

### Runtime profiles
The runtime can be compiled with several cargo feature flags, to produce slightly different configurations.
The main difference between these configurations is around the council election periods lenghts, proposal periods (voting and gracing), and block production interval.

There are 4 profiles:
 - production: used in production mainnet (this is the default when no explicit feature flag is provided)
 - staging: used on long running staging testnets
 - playground: used when deploying simple shared development testnets
 - testing: used when running integration tests

### Integration tests
How they differ from rust/cargo unit tests.
In addition to cargo unit tests for runtime features, over time we have developed a growing suite of integration tests. This is more of an end to end testing framework for testing proper functioning of the joystream platform as a whole. It involves running a scaled down joystream network on a local development machine and running through as many flows of interaction through extrinsics and testing that components such as the runtime, query-node and storage infrastructure behave as expected.

To run tests we build the joystream/node with the testing runtime profile and execute the test suite:

```sh
RUNTIME_PROFILE=TESTING ./build-node-docker.sh
tests/network-tests/run-tests.sh
```

### Running a Testing playground
In addition to running automated test, it makes sense to also do some manual testing of apps, like polkadot-js, pioneer, and atlas.
For you can conveniently run a local playground and point those apps to it:

```sh
# build node with the playground profile
RUNTIME_PROFILE=PLAYGROUND ./build-node-docker.sh

# start a local playground with 1 storage node and 1 distributor node
RUNTIME_PROFILE=PLAYGROUND ./start.sh
# or start a loca playground with 2 storage nodes and 2 distributor nodes
RUNTIME_PROFILE=PLAYGROUND ./start-multistorage.sh
```

### Upgrade Testing
In addition to testing the new runtime in isolation, it is imperative that it be tested through performing an actual upgrade of the existing runtime. This would be done on a test network or playground. To make it practical the proposal needs to be executed in a short period in these test environments so using a testing profile or playground profile would be best.

Specific test scenario should be written to test for any state migration code performed after the upgrade, or for any custom decoding implemented for old types.

#### Automated runtime upgrade testing
There are some scripts in `tests/network-tests/run-migration-tests.sh` that are executed by github workflow to perform such tests,
but they should also be executed locally.

The tool is being updated for Ephesus network: https://github.com/Joystream/joystream/pull/4569

### Additional Resources
Some tooling that would be useful to add to our node and runtime to improve testing capabilities:
- https://docs.substrate.io/reference/how-to-guides/tools/use-try-runtime/
- https://docs.substrate.io/reference/command-line-tools/try-runtime/
