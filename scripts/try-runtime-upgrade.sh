#!/usr/bin/env bash
set -e

cd `git rev-parse --show-toplevel`

# Always runs pre-and-post checks
RUN_MIGRATION_TESTS=true RUST_LOG=info WS=wss://rpc.joystream.org:443/ \
  cargo +nightly-2022-11-15 test remote_tests::run_migrations --release --features try-runtime
