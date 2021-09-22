#!/usr/bin/env bash

# Directory to write generated documentation to
OUT_DIR_DOC="./doc"
mkdir -p ${OUT_DIR_DOC}

# Gernerate Markdown docs
protoc \
    --doc_out="${OUT_DIR_DOC}" --doc_opt=markdown,index.md \
    proto/*.proto

# Append some custom docs to generated protocol docs
cat doc-appendix.md >> ${OUT_DIR_DOC}/index.md
