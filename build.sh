#!/usr/bin/env bash

set -e

yarn
yarn workspace @joystream/types build
yarn workspace @joystream/cd-schemas generate:all
yarn workspace @joystream/cd-schemas build
yarn workspace @joystream/cli build
yarn workspace query-node-root build
yarn workspace storage-node build
# Not strictly needed during development, we run "yarn workspace pioneer start" to start
# a dev instance, but will show highlight build issues
yarn workspace pioneer build

if ! command -v docker-compose &> /dev/null
then
  echo "docker-compose not found, skipping docker build!"
else
  # Build joystream/apps docker image
  docker-compose build pioneer

  # Optionally build joystream/node docker image
  # TODO: Try to fetch a cached joystream/node image
  # if one is found matching code shasum instead of building
  while true
  do
    read -p "Rebuild joystream/node docker image? (y/N): " answer2

    case $answer2 in
    [yY]* ) docker-compose build joystream-node
            break;;

    [nN]* ) break;;

    * )     break;;
    esac
  done
fi

# Build cargo crates: native binaries joystream/node, wasm runtime, and chainspec builder.
while true
do
  read -p "Compile joystream node native binary? (y/N): " answer1

  case $answer1 in
   [yY]* ) yarn cargo-checks
           yarn cargo-build
           break;;

   [nN]* ) break;;

   * )     break;;
  esac
done
