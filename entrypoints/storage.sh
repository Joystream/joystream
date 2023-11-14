#!/usr/bin/env bash

# docker entrypoint fot storage node, to allow running with telemetry
if [[ "$TELEMETRY_ENABLED" = "yes" ]] && [[ $1 = "server" ]]; then
    node --require @joystream/opentelemetry /joystream/storage-node/bin/run $*
else
    /joystream/storage-node/bin/run $*
fi
