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
import { channelPayoutProof } from '@joystreamjs/content'

const readContext = 'PATH' // 'PATH' | 'URL'
const inputFilePath = './payload'
const channelId = 1
const payoutRecord = await channelPayoutProof(channelId)
```

### Getting channel payout record from serialized payload file at given byte

```javascript
import { channelPayoutProofAtByteOffset } from '@joystreamjs/content'

const readContext = 'PATH' // 'PATH' | 'URL'
const inputFilePath = './payload'
const byteOffset = 40
const payoutRecord = await channelPayoutProofAtByteOffset(readContext, input, byteOffset)
```

### Get header from serialized channel payouts payload file

```javascript
import { serializedPayloadHeader } from '@joystreamjs/content'
import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'

const readContext = 'PATH' // 'PATH' | 'URL'
const serializedHeader = await serializedPayloadHeader(readContext, input)
// decode header
const header = ChannelPayoutsMetadata.Header.decode(serializedHeader)
console.log(
  header.payloadLengthInBytes,
  header.headerLengthInBytes,
  header.numberOfChannels,
  header.channelPayoutByteOffsets
)
```

### Generate merkle root from serialized channel payouts payload

```javascript
import { generateMerkleRoot } from '@joystreamjs/content'

const inputFilePath = './payload'
const readContext = 'PATH' // 'PATH' | 'URL'
const merkleRoot = await generateCommitmentFromPayloadFile(inputFilePath)
```
