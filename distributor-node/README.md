# Joystream Distributor CLI

The Joystream Distributor CLI package contains a set of commands that allow:
- running the actual distributor node,
- performing the node operator on-chain duties (like setting the node metadata)
- performing the distribution working group leader on-chain duties (like setting the distribution system limits, assigning distribution bags and buckets)

**To see the list of all available commands and their flags / arguments, check out the [commands](docs/commands/index.md) documentation.**

## Configuration

### Config file

All the configuration values required by Joystream Distributor CLI are provided via a single configuration file (either `yml` or `json`).

The path to the configuration will be (ordered from highest to lowest priority):
- The value of `--configPath` flag provided when running a command, _or_
- The value of `CONFIG_PATH` environment variable, _or_
- `config.yml` in the current working directory by default

### ENV variables

All configuration values can be overriden using environment variables, which may be useful when running the distributor node as docker service.

To determine environment variable name based on a config key, for example `intervals.cacheCleanup`, use the following formula:
- convert `pascalCase` fieldnames to `SCREAMING_SNAKE_CASE`: `intervals.cacheCleanup` => `INTERVALS.CACHE_CLEANUP`
- replace all dots with `__`: `INTERVALS.CACHE_CLEANUP` => `INTERVALS__CACHE_CLEANUP`
- add `JOYSTREAM_DISTRIBUTOR__` prefix: `INTERVALS__CACHE_CLEANUP` => `JOYSTREAM_DISTRIBUTOR__INTERVALS__CACHE_CLEANUP`

In case of arrays, the values must be provided as json string, for example `JOYSTREAM_DISTRIBUTOR__KEYS="[{\"suri\":\"//Bob\"}]"`.

For more envirnoment variable examples see the `distributor-node` service configuration in [docker-compose.yml](../docker-compose.yml).

**For detailed configuration reference, checkout the [config schema](docs/schema/definition.md) documentation.**

## Distributor Node

**To understand how the distributor node works in detail, checkout the [node](docs/node/index.md) documentation.**
