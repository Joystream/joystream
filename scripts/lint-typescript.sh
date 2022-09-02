#!/usr/bin/env bash
set -e

# use
# lint-typescript.sh # check-only format and lint
# lint-typescript.sh --fix # ensure proper format and lint

# enumerate all yarn workspaces that contains lintable TS code
WORKSPACES=(
  query-node-root
  @joystream/distributor-cli
  @joystream/cli
  network-tests
  @joystream/types
  @joystream/metadata-protobuf
  storage-node
)

# checks that whole code is properly formatted and linted
function check_lint() {
  echo 'Running TypeScript lints'

  # print yarn workspace name that contains lint or format errors
  function lint_error() {
    echo "Linting error encountered in the package $1"
    echo "Try running \`$0 --fix\` or fix issues manually"
  }

  for workspace in "${WORKSPACES[@]}"
  do
    # plan printing extra info on lint or format error
    trap "lint_error $workspace" ERR

    # check that workspace is formatted and linted
    echo "Checking workspace '${workspace}'"
    yarn workspace $workspace checks
  done
}

# ensures proper format and lint in workspaces
function fix_lint() {
  echo 'Fixing TypeScript lints'

  for workspace in "${WORKSPACES[@]}"
  do
    echo "Fixing workspace '${workspace}'"

    # fix formating in workspace
    yarn workspace $workspace format

    # fix linting in worskpace
    yarn workspace $workspace lint --fix
  done
}

if [[ $1 == '--fix' ]]; then
  fix_lint
else
  check_lint
fi
