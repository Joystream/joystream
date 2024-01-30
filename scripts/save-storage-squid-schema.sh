#!/bin/bash

set -e

# Check if the schema file argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <schema_file>"
    exit 1
fi

schema_file="$1"

# Run the Docker command and capture the schema
schema=`docker run --rm joystream/storage-squid:latest npm run get-graphql-schema`

# Check if the schema is not empty
if [ -n "$schema" ]; then
    # Write the schema to the specified file
    echo "$schema" >"$schema_file"
    echo "Schema updated successfully in $schema_file."
else
    echo "Schema output is empty. Skipping overwriting schema file."
fi
