# Joystream Substrate Node

Joystream node built on top of Substrate.

## Initial setup

Call this script once. It will init WASM environment and build a node.
It will take some time (tens of minutes), so be patient.

```sh
./init.sh
```

## Build runtime

Call this script every time you updated a runtime, before restarting a node.

```sh
./build.sh
```

## Start node

```sh
./start-node.sh
```

## Clean chain data

It's a good practice to clean chain data after a runtime updated and you are about to restart a node.

```sh
./clean-chain.sh
```
