#!/bin/bash
# Script to update Substrate dependencies to Polkadot SDK v1.7.0

set -e

OLD_REPO="https://github.com/joystream/substrate.git"
NEW_REPO="https://github.com/paritytech/polkadot-sdk.git"
OLD_REV="1d0eefca86ef31b9e7727df01a6ed23ad65491e9"
NEW_TAG="polkadot-v1.7.0"

echo "Updating Substrate dependencies from Joystream fork to Polkadot SDK v1.7.0..."

# Find and update all Cargo.toml files
find . -name "Cargo.toml" -not -path "*/target/*" -not -path "*/node_modules/*" -exec sed -i "s|git = '${OLD_REPO}', rev = '${OLD_REV}'|git = '${NEW_REPO}', tag = '${NEW_TAG}'|g" {} \;

echo "Update complete!"
echo ""
echo "Files updated:"
git diff --name-only | grep Cargo.toml | wc -l
echo "Cargo.toml files"

