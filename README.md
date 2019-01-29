# Joystream Substrate Node

Joystream node built on top of Substrate.

## Initial setup

Call this script once. It will init WASM environment and build a node.
It will take some time (tens of minutes), so be patient.

```bash
./init.sh
```

## Build runtime

Call this script every time you updated a runtime, before restarting a node.

```bash
./build.sh
```

## Start node

```bash
./start-node.sh
```

## Clean chain data

It's a good practice to clean chain data after a runtime updated and you are about to restart a node.

```bash
./clean-chain.sh
```

## Test

```bash
./test-all.sh
```
