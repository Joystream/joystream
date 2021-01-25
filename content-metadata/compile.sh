#!/usr/bin/env bash

# Path to this plugin
PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"

# Directory to write generated code to (.js and .d.ts files)
OUT_DIR="./"
# mkdir -p ${OUT_DIR}

# Directory to write generated documentation to
OUT_DIR_DOC="./doc"

mkdir -p ${OUT_DIR_DOC}

protoc \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}" \
    --ts_out="${OUT_DIR}" \
    --doc_out="${OUT_DIR_DOC}" --doc_opt=markdown,index.md \
    proto/*.proto