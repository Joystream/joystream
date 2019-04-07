#!/usr/bin/env bash
set -e

if cargo --version | grep -q "nightly"; then
	CARGO_CMD="cargo"
else
	CARGO_CMD="cargo +nightly"
fi

pushd wasm/

$CARGO_CMD build --target=wasm32-unknown-unknown --release

for i in joystream_node_runtime_wasm
do
	wasm-gc target/wasm32-unknown-unknown/release/$i.wasm target/wasm32-unknown-unknown/release/$i.compact.wasm
done

set -e

echo "*** Initialising WASM build environment"

if [ -z $CI_PROJECT_NAME ] ; then
   rustup update nightly
   rustup update stable
fi

rustup target add wasm32-unknown-unknown --toolchain nightly

# Install wasm-gc. It's useful for stripping slimming down wasm binaries.
command -v wasm-gc || \
	cargo +nightly install --git https://github.com/alexcrichton/wasm-gc