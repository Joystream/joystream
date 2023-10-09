#!/usr/bin/env bash
set -e

SCRIPT_PATH=`dirname "${BASH_SOURCE[0]}"`
cd $SCRIPT_PATH

RUNTIME_PROFILE=TESTING ./run-node-docker.sh