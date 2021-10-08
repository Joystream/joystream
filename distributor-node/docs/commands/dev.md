`joystream-distributor dev`
===========================

Developer utility commands

* [`joystream-distributor dev:batchUpload`](#joystream-distributor-devbatchupload)
* [`joystream-distributor dev:init`](#joystream-distributor-devinit)

## `joystream-distributor dev:batchUpload`

```
undefined

USAGE
  $ joystream-distributor dev:batchUpload

OPTIONS
  -B, --bucketId=bucketId          (required) Storage bucket id
  -C, --batchesCount=batchesCount  (required)
  -S, --batchSize=batchSize        (required)
  -b, --bagId=bagId                (required)

  -c, --configPath=configPath      [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                                   directory)

  -y, --yes                        Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/dev/batchUpload.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/dev/batchUpload.ts)_

## `joystream-distributor dev:init`

Initialize development environment. Sets Alice as distributor working group leader.

```
Initialize development environment. Sets Alice as distributor working group leader.

USAGE
  $ joystream-distributor dev:init

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/dev/init.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/dev/init.ts)_
