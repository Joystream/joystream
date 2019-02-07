# Joystream Substrate Node

Joystream node built on top of Substrate.

## Initial setup

Call this script once. It will init WASM environment and build a node.
It will take some time (tens of minutes), so be patient.

```bash
./init.sh
```

## Build

### Build runtime (WASM)

```bash
./build-runtime.sh
```

### Build node (native)

```bash
./build-node.sh
```

## Start node

```bash
./start-node.sh
```

## Clean chain data

It's a good practice to clean chain data after you rebuilt a node and about to restart a it.

```bash
./clean-chain.sh
```

## Test

### Run all tests

```bash
./test-all.sh
```

### Test a specific module

Check out `./test-proposals.sh` on how to run tests for a specific module.
