#!/usr/bin/env bash

# docker entrypoint fot graphql-server, to allow running with telemetry
if [[ "$TELEMETRY_ENABLED" = "yes" ]]; then
    export OTEL_APPLICATION=query-node
    yarn workspace query-node-root query-node:start:prod:with-instrumentation $*
else
    yarn workspace query-node-root query-node:start:prod:pm2 $*
fi
