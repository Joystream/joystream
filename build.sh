#!/usr/bin/env bash
yarn install
git checkout node_modules/joystream
for pkg in packages/* ; do
  name=$(echo $pkg | cut -d'/' -f2)
  ln -snf "../$pkg" "node_modules/$name"
done
yarn run tsc --build tsconfig.json
