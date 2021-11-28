#!/usr/bin/env bash
set -e

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    # We could get the specific network address for the docker network with
    #   docker network inspect --format='{{range .IPAM.Config}}{{.Gateway}}{{end}}' joystream_default
    ip route | awk '/default/ {print $3}'
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # try en0 if not set then en1 (Wired or Wireless)
    ipconfig getifaddr en0 || ipconfig getifaddr en1
fi

# Some alternative approaches (cross platform)
# ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'