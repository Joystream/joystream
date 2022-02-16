# @joystreamjs/content

Interact with content directory module - managing payouts, channels, videos, assets, categories and curator groups

## Installation

```
yarn install @joystreamjs/content
```

## Development

1. Run `yarn` to install dependencies
2. Run `yarn build` to build the package

## Usage

### Getting payout record by channel Id

This function gets the payout record from the remote source. It first fetches the payload
header and then uses the `offset` of given channel Id from header to fetch the record.

```javascript
import { creatorPayoutRecord } from '@joystreamjs/content'

const channelId = 1
const payoutRecord = await creatorPayoutRecord(channelId)
```

### Getting creator payout record from serialized payload file at given byte

```javascript
import { creatorPayoutRecordAtByteOffset } from '@joystreamjs/content'

const inputFilePath = './payload'
const byteOffset = 40
const payoutRecord = await creatorPayoutRecordAtByteOffset(input, byteOffset)
```

### Get header from serialized creator payouts payload file

```javascript
import { serializedPayloadHeader } from '@joystreamjs/content'
import { CreatorPayoutPayload } from '@joystream/metadata-protobuf'

const serializedHeader = await serializedPayloadHeader(input)
// decode header
const header = CreatorPayoutPayload.Header.decode(serializedHeader)
console.log(
  header.payloadLengthInBytes,
  header.headerLengthInBytes,
  header.numberOfChannels,
  header.creatorPayoutByteOffsets
)
```

### Create serialized creator payouts payload from JSON input

```javascript
import { generateSerializedPayload } from '@joystreamjs/content'
import { CreatorPayoutPayload as CreatorPayoutPayloadInput } from '@joystreamjs/utils/typings/CreatorPayoutPayload.schema'

const payloadBodyInput: CreatorPayoutPayloadInput = [
  {
    channelId: 0,
    cumulativePayoutOwed: 20,
    merkleBranch: [
      {
        hash: '7a7b2d34',
        side: 1,
      },
      {
        hash: '74bd3bc2',
        side: 0,
      },
    ],
    payoutRationale: 'reward for best content creator',
  },
]
const serializedPayload = generateSerializedPayload(payloadBodyInput)
```

### Generate merkle root from serialized creator payouts payload

```javascript
import { generateMerkleRoot } from '@joystreamjs/content'

const inputFilePath = './payload'
const merkleRoot = await generateMerkleRoot(inputFilePath)
```
