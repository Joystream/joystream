`joystream-distributor operator`
================================

Accept pending distribution bucket operator invitation.
  Requires the invited distribution group worker role key.

* [`joystream-distributor operator:accept-invitation`](#joystream-distributor-operatoraccept-invitation)
* [`joystream-distributor operator:set-metadata`](#joystream-distributor-operatorset-metadata)

## `joystream-distributor operator:accept-invitation`

Accept pending distribution bucket operator invitation.

```
Accept pending distribution bucket operator invitation.
  Requires the invited distribution group worker role key.

USAGE
  $ joystream-distributor operator:accept-invitation

OPTIONS
  -B, --bucketId=bucketId      (required) Distribution bucket id

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -f, --familyId=familyId      (required) Distribution bucket family id

  -w, --workerId=workerId      (required) ID of the invited operator (distribution group worker)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations

DESCRIPTION
  Requires the invited distribution group worker role key.
```

_See code: [src/commands/operator/accept-invitation.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/operator/accept-invitation.ts)_

## `joystream-distributor operator:set-metadata`

Set/update distribution bucket operator metadata.

```
Set/update distribution bucket operator metadata.
  Requires active distribution bucket operator worker role key.

USAGE
  $ joystream-distributor operator:set-metadata

OPTIONS
  -B, --bucketId=bucketId      (required) Distribution bucket id

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -e, --endpoint=endpoint      Root distribution node endpoint

  -f, --familyId=familyId      (required) Distribution bucket family id

  -i, --input=input            Path to JSON metadata file

  -w, --workerId=workerId      (required) ID of the operator (distribution group worker)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations

DESCRIPTION
  Requires active distribution bucket operator worker role key.
```

_See code: [src/commands/operator/set-metadata.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/operator/set-metadata.ts)_
