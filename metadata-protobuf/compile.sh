#!/usr/bin/env bash

# Directory to write generated code to (.js and .d.ts files)
OUT_DIR="./compiled"
mkdir -p ${OUT_DIR}

yarn pbjs \
  -t="static-module" \
  -w="commonjs" \
  -o="${OUT_DIR}/index.js" \
  --force-long \
  proto/*.proto

yarn pbts \
  -o="${OUT_DIR}/index.d.ts" \
  ${OUT_DIR}/*.js
