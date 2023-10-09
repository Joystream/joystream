#!/usr/bin/env bash
set -e

if [[ "$RUNTIME_PROFILE" == "TESTING" ]]; then
  echo "testing-runtime"
  exit 0
fi

if [[ "$RUNTIME_PROFILE" == "STAGING" ]]; then
  echo "staging-runtime"
  exit 0
fi

if [[ "$RUNTIME_PROFILE" == "PLAYGROUND" ]]; then
  echo "playground-runtime"
  exit 0
fi

# Production runtime, no extra features needed
if [[ "$RUNTIME_PROFILE" == "" ]]; then
  exit 0
fi

# Fast Production runtime
if [[ "$RUNTIME_PROFILE" == "FAST-PROD" ]]; then
  echo "warp-time"
  exit 0
fi

>&2 echo "Unrecognized RUNTIME_PROFILE ${RUNTIME_PROFILE}"
exit -1