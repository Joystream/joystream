#!/usr/bin/env bash

# docker entrypoint fot distributor node, to allow running with telemetry
if [[ "$TELEMETRY_ENABLED" = "yes" ]] && [[ $1 = "start" ]]; then
    node --require @joystream/opentelemetry /joystream/distributor-node/bin/run $*
else
    /joystream/distributor-node/bin/run $*
fi
