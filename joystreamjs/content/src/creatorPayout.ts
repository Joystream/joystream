import { CreatorPayoutPayload, ICreatorPayoutPayload } from '@joystream/metadata-protobuf'
import { asValidatedMetadata, getByteSequenceFromFile } from '@joystreamjs/utils'
import { CreatorPayoutPayload as CreatorPayoutPayloadInput } from '@joystreamjs/utils/typings/CreatorPayoutPayload.schema'
import { blake2AsHex, blake2AsU8a } from '@polkadot/util-crypto'
import axios from 'axios'
import _ from 'lodash'
import Long from 'long'
import { Writer, Reader } from 'protobufjs'

const PAYLOAD_CONTEXT = ['Header', 'Body'] as const
type PayloadContext = typeof PAYLOAD_CONTEXT[number]

// get Payout Record for given channel Id
export async function creatorPayoutRecord(channelId: number): Promise<CreatorPayoutPayload.Body.CreatorPayout> {
  const header = (await fetchCreatorPayout('Header')) as CreatorPayoutPayload.Header
  if (!header.creatorPayoutByteOffsets.length) {
    throw new Error('No payout record exists')
  }

  const channelRecordOffset = header.creatorPayoutByteOffsets.find(
    (payoutOffset) => payoutOffset.channelId === channelId
  )
  if (!channelRecordOffset) {
    throw new Error(`No payout record exists for channel with channel id ${channelId}`)
  }

  const creatorPayoutRecord = (await fetchCreatorPayout(
    'Body',
    channelRecordOffset.byteOffset.toNumber()
  )) as CreatorPayoutPayload.Body.CreatorPayout

  return creatorPayoutRecord
}

export async function serializedPayloadHeader(inputFilePath: string): Promise<Uint8Array> {
  // read arbitrary bytes from payload starting at offset
  const arbitraryBytes = await getByteSequenceFromFile(inputFilePath, 1, 4)
  const lengthOfSerializedHeader = Reader.create(arbitraryBytes).uint32()

  const byteLengthOfVarintEncodedHeaderSize = Writer.create().uint32(lengthOfSerializedHeader).finish().byteLength
  const serializedzHeader = await getByteSequenceFromFile(
    inputFilePath,
    1 + byteLengthOfVarintEncodedHeaderSize,
    byteLengthOfVarintEncodedHeaderSize + lengthOfSerializedHeader
  )

  return serializedzHeader
}

export async function creatorPayoutRecordAtByteOffset(
  inputFilePath: string,
  byteOffset: number
): Promise<CreatorPayoutPayload.Body.CreatorPayout> {
  // read arbitrary bytes from payload starting at offset
  const arbitraryBytes = await getByteSequenceFromFile(inputFilePath, byteOffset, byteOffset + 10)
  const lengthOfSerializedPayoutRecord = Reader.create(arbitraryBytes).uint32()

  const byteLengthOfVarintEncodedMessageSize = Writer.create()
    .uint32(lengthOfSerializedPayoutRecord)
    .finish().byteLength

  const serializedPayoutRecord = await getByteSequenceFromFile(
    inputFilePath,
    byteOffset + byteLengthOfVarintEncodedMessageSize,
    byteOffset + lengthOfSerializedPayoutRecord
  )
  return CreatorPayoutPayload.Body.CreatorPayout.decode(serializedPayoutRecord)
}

export function byteLengthOfHeader(numberOfChannels: number): Long {
  // protobuf serializes fields in (key,value) pairs & Tag(key)
  // length will be one byte for all fields in this payload
  const byteLengthOfTag = 1

  // P: byte length of entire payload
  // H: byte length of header
  // N: number of channels
  // N times: serialized c_i||offset_i
  const payloadLengthFieldSize = 8
  const payloadHeaderLengthFieldSize = 8
  const numberOfChannelsFieldSize = 4

  const byteLengthOfByteOffsetsArray = numberOfChannels * (byteLengthOfTag + 4 + byteLengthOfTag + 8)

  return Long.fromNumber(
    payloadLengthFieldSize + payloadHeaderLengthFieldSize + numberOfChannelsFieldSize + byteLengthOfByteOffsetsArray
  )
}

// byte length of message size value, encoded as a varint
function lengthOfVarintEncodedMessageSizeValue(serializedMessageLength: number): number {
  return Writer.create().uint32(serializedMessageLength).finish().byteLength
}

export function generateSerializedPayload(payloadBodyInput: CreatorPayoutPayloadInput): Uint8Array {
  if (payloadBodyInput.length === 0) throw new Error('payload is empty')

  const numberOfChannels = payloadBodyInput.length
  const headerLengthInBytes = byteLengthOfHeader(numberOfChannels)
  const creatorPayoutByteOffsets: CreatorPayoutPayload.Header.ICreatorPayoutByteOffset[] = []

  const body = asValidatedMetadata(CreatorPayoutPayload.Body, { creatorPayouts: payloadBodyInput })

  body.creatorPayouts?.forEach(({ channelId }) => {
    creatorPayoutByteOffsets.push({ channelId, byteOffset: Long.fromNumber(0) })
  })

  const payload: ICreatorPayoutPayload = {
    header: {
      payloadLengthInBytes: Long.fromNumber(0), // cant know the length of the payload at this point. Will be known when the payload will be serialized once and hence it will be set then
      headerLengthInBytes,
      numberOfChannels,
      creatorPayoutByteOffsets,
    },
    body,
  }

  const serializedDummyPayload = Buffer.from(CreatorPayoutPayload.encode(payload).finish())
  const payloadLengthInBytes = Long.fromNumber(serializedDummyPayload.byteLength)

  for (let i = 0; i < numberOfChannels; i++) {
    const channelPayoutRecord = CreatorPayoutPayload.Body.CreatorPayout.encode(body.creatorPayouts![i]).finish()
    const indexOfChannelPayoutRecord = serializedDummyPayload.indexOf(channelPayoutRecord)
    payload.header.creatorPayoutByteOffsets![i].byteOffset = Long.fromNumber(
      indexOfChannelPayoutRecord - lengthOfVarintEncodedMessageSizeValue(Buffer.from(channelPayoutRecord).byteLength)
    )
  }

  payload.header.payloadLengthInBytes = payloadLengthInBytes
  const serializedPayload = CreatorPayoutPayload.encode(payload).finish()

  return serializedPayload
}

// generate merkle proof
export function generateProof(creatorPayout: CreatorPayoutPayload.Body.CreatorPayout): Uint8Array {
  // item = hash(c_i||p_i||m_i)
  const item = new Uint8Array([
    ...new Uint8Array(creatorPayout.channelId),
    ...new Uint8Array(creatorPayout.cumulativePayoutOwed),
    ...blake2AsU8a(creatorPayout.payoutRationale),
  ])

  const merkleRoot = creatorPayout.merkleBranches.reduce((hashV, el) => {
    if (el.side === CreatorPayoutPayload.Body.CreatorPayout.Side.Right) {
      return blake2AsU8a(new Uint8Array([...hashV, ...el.merkleBranch]))
    } else return blake2AsU8a(new Uint8Array([...el.merkleBranch, ...hashV]))
  }, blake2AsU8a(item))

  return merkleRoot
}

// function to generate merkle root
// code: https://github.com/Joystream/joystream/blob/runtime-modules/content/src/tests/fixtures.rs#L1578
export function generateMerkleRoot(payloadBodyInput: CreatorPayoutPayloadInput): string {
  // generates merkle root from the ordered sequence collection.
  // The resulting vector is structured as follows: elements in range
  // [0..collection.len()) will be the tree leaves (layer 0), elements in range
  // [collection.len()..collection.len()/2) will be the nodes in the next to last layer (layer 1)
  // [layer_n_length..layer_n_length/2) will be the number of nodes in layer(n+1)
  if (payloadBodyInput.length === 0) throw new Error('payload is empty')
  const out: string[] = []

  payloadBodyInput.forEach((record) => {
    // leafNode = c_i||p_i||m_i, where m_i = hash(d_i)
    const leafNode =
      record.channelId.toString() + record.cumulativePayoutOwed.toString() + blake2AsHex(record.payoutRationale)
    out.push(blake2AsHex(leafNode))
  })

  let start = 0
  let lastLen = out.length
  let maxLen = Math.floor(lastLen / 2)
  let rem = lastLen % 2

  while (maxLen !== 0) {
    lastLen = out.length
    for (let i = 0; i < maxLen; i++) {
      out.push(blake2AsHex(out[start + 2 * i] + out[start + 2 * i + 1]))
    }
    if (rem === 1) {
      out.push(blake2AsHex(out[lastLen - 1] + out[lastLen - 1]))
    }
    const newLen = out.length - lastLen
    rem = newLen % 2
    maxLen = Math.floor(newLen / 2)
    start = lastLen
  }

  const merkleRoot = out.pop()
  if (merkleRoot) {
    return merkleRoot
  } else {
    throw new Error('payload is empty')
  }
}

// fetch creator payout payloaf  from remote source
async function fetchCreatorPayout(
  context: PayloadContext,
  offset?: number
): Promise<CreatorPayoutPayload.Header | CreatorPayoutPayload.Body.CreatorPayout> {
  // HTTP Url of remote host where payload is stored
  let url = process.env.CREATOR_PAYOUT_DATA_URL as string
  if (_.isEmpty(url)) {
    throw new Error('cannot fetch creator payout data, remote url does not exist')
  }

  if (context === 'Header') {
    url = `${url}?header`
  } else if (context === 'Body' && offset !== undefined) {
    url = `${url}?offset=${offset}`
  } else throw new Error('Invalid fetch creator payout parameters')

  const response = await axios.get(url, {
    headers: {
      responseType: 'arraybuffer',
    },
  })
  if (response.status !== 200) {
    throw new Error('invalid response while fetching creator payout data')
  }

  const responseBuffer = Buffer.from(response.data)
  if (context === 'Header') {
    return CreatorPayoutPayload.Header.decode(responseBuffer)
  } else return CreatorPayoutPayload.Body.CreatorPayout.decode(responseBuffer)
}
