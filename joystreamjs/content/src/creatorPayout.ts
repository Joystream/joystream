import { CreatorPayoutPayload, ICreatorPayoutPayload } from '@joystream/metadata-protobuf'
import { asValidatedMetadata, getByteSequenceFromFile } from '@joystreamjs/utils'
import { CreatorPayoutPayload as CreatorPayoutPayloadInput } from '@joystreamjs/utils/typings/CreatorPayoutPayload.schema'
import { blake2AsHex } from '@polkadot/util-crypto'
import axios from 'axios'
import _ from 'lodash'
import Long from 'long'
import { Writer, Reader } from 'protobufjs'

const PAYLOAD_CONTEXT = ['Header', 'Body'] as const
type PayloadContext = typeof PAYLOAD_CONTEXT[number]

/**
 * Get Payout Record for given channel Id. It uses the `fetchCreatorPayout`
 * function to retrieve the record from remote source
 * @param channelId Id of the channel
 * @returns payout record for given channel Id
 */
export async function creatorPayoutRecord(channelId: number): Promise<CreatorPayoutPayload.Body.CreatorPayout> {
  const header = (await fetchCreatorPayout('Header')) as CreatorPayoutPayload.Header
  if (!header.creatorPayoutByteOffsets.length) {
    throw new Error('No payout record exists')
  }

  const creatorPayoutRecordOffset = header.creatorPayoutByteOffsets.find(
    (payoutOffset) => payoutOffset.channelId === channelId
  )
  if (!creatorPayoutRecordOffset) {
    throw new Error(`No payout record exists for channel with channel id ${channelId}`)
  }

  const creatorPayoutRecord = (await fetchCreatorPayout(
    'Body',
    creatorPayoutRecordOffset.byteOffset.toNumber()
  )) as CreatorPayoutPayload.Body.CreatorPayout

  return creatorPayoutRecord
}

/**
 * PROTOBUF MESSAGE STRUCTURE
 *
 * ----------------------------------------
 * | Tag(key) | Size | Serialized Message |
 * ----------------------------------------
 * @tag Type info, and field number of message
 * @size Size of the message encoded as varint
 * @message Serialized message
 */

/**
 * calculates byte length of message `size` - encoded as varint. Protobuf encodes the
 * message as `varint_encoded_message_size||serialized_message` e.g., for serialized
 * message of 10 bytes, protobuf encoded message would look like: `0a||0b0c0d0e0f1a1b1c1d1e`.
 * Since `size` of example message is encoded in 1 byte so the function will return 1.
 * @param serializedMessageLength length of serialized message in number of bytes
 * @return length of varint encoded message size in number of bytes
 */
function lengthOfVarintEncodedMessageSize(serializedMessageLength: number): number {
  return Writer.create().uint32(serializedMessageLength).finish().byteLength
}

/**
 * We dont have any prior knowledge of how many bytes are used to encode the size information of the message,
 * so we arbitrary read `n` bytes from the payload based on the assumption that the size of the header CAN BE
 * encoded in `n` bytes. For reference, if serialized message is over 4 TB then its size information can be
 * encoded in just 6 bytes
 * @param inputFilePath path to protobuf serialized payload file
 * @param messageOffset byte offset of message in serialized payload
 * @returns length of serialized message in number of bytes
 */
async function lengthOfSerializedMessage(inputFilePath: string, messageOffset: number): Promise<number> {
  // TODO: improve the implementation by reading size info byte by byte
  // TODO: and checking most significant bit (msb) of each byte.
  const arbitraryBytes = await getByteSequenceFromFile(inputFilePath, messageOffset, messageOffset + 6)
  const lengthOfMessage = Reader.create(arbitraryBytes).uint32()
  return lengthOfMessage
}

/**
 * Get serialized payload header from a local file.
 * @param inputFilePath path to protobuf serialized payload file
 * @return bytes of payload header
 **/
export async function serializedPayloadHeader(inputFilePath: string): Promise<Uint8Array> {
  // skip the first byte which is the Tag(key) of `Header` message
  const lengthOfSerializedHeader = await lengthOfSerializedMessage(inputFilePath, 1)
  const lengthOfVarintEncodedHeaderSize = lengthOfVarintEncodedMessageSize(lengthOfSerializedHeader)
  const serializedHeader = await getByteSequenceFromFile(
    inputFilePath,
    1 + lengthOfVarintEncodedHeaderSize,
    lengthOfVarintEncodedHeaderSize + lengthOfSerializedHeader
  )

  return serializedHeader
}

/**
 * Get creator payout record from local serialized payload file.
 * @param inputFilePath path to protobuf serialized payload file
 * @param byteOffset byte offset of creator payout record in serialized payload
 * @return creator payout record
 **/
export async function creatorPayoutRecordAtByteOffset(
  inputFilePath: string,
  byteOffset: number
): Promise<CreatorPayoutPayload.Body.CreatorPayout> {
  const lengthOfSerializedRecord = await lengthOfSerializedMessage(inputFilePath, byteOffset)
  const lengthOfVarintEncodedRecordSize = lengthOfVarintEncodedMessageSize(lengthOfSerializedRecord)
  const serializedPayoutRecord = await getByteSequenceFromFile(
    inputFilePath,
    byteOffset + lengthOfVarintEncodedRecordSize,
    byteOffset + lengthOfSerializedRecord
  )

  return CreatorPayoutPayload.Body.CreatorPayout.decode(serializedPayoutRecord)
}

// calculates byte length of the serialized payload header
function lengthOfHeader(numberOfChannels: number): number {
  // protobuf serializes fields in (key,value) pairs. Tag(key)
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
  return (
    payloadLengthFieldSize + payloadHeaderLengthFieldSize + numberOfChannelsFieldSize + byteLengthOfByteOffsetsArray
  )
}

/**
 * Generate serialized payload from JSON encoded creator payouts.
 * @param payloadBodyInput path to JSON file containing creator payouts
 * @returns serialized creator payouts payload
 */
export function generateSerializedPayload(payloadBodyInput: CreatorPayoutPayloadInput): Uint8Array {
  if (payloadBodyInput.length === 0) throw new Error('payload is empty')

  const numberOfChannels = payloadBodyInput.length
  const headerLengthInBytes = Long.fromNumber(lengthOfHeader(numberOfChannels))
  const creatorPayoutByteOffsets: CreatorPayoutPayload.Header.ICreatorPayoutByteOffset[] = []
  const body = asValidatedMetadata(CreatorPayoutPayload.Body, { creatorPayouts: payloadBodyInput })

  // Length of Header is known prior to serialization since its fields are fixed size, however the
  // length of the COMPLETE payload can only be known after it has been serialized since Body fields
  // are varint encoded.
  // So we cant set payload length & byte offsets, to resolve this issue payload will be serialized
  // with empty payload length & byte offsets, and once serialized both unknowns can be obtained
  // from payload
  body.creatorPayouts?.forEach(({ channelId }) => {
    creatorPayoutByteOffsets.push({ channelId, byteOffset: Long.fromNumber(0) })
  })
  const payload: ICreatorPayoutPayload = {
    header: {
      payloadLengthInBytes: Long.fromNumber(0),
      headerLengthInBytes,
      numberOfChannels,
      creatorPayoutByteOffsets,
    },
    body,
  }

  const serializedPayloadWithEmptyHeaderFields = Buffer.from(CreatorPayoutPayload.encode(payload).finish())
  const payloadLengthInBytes = Long.fromNumber(serializedPayloadWithEmptyHeaderFields.byteLength)

  for (let i = 0; i < numberOfChannels; i++) {
    const channelPayoutRecord = CreatorPayoutPayload.Body.CreatorPayout.encode(body.creatorPayouts![i]).finish()
    const indexOfChannelPayoutRecord = serializedPayloadWithEmptyHeaderFields.indexOf(channelPayoutRecord)
    // set correct byteOffsets
    payload.header.creatorPayoutByteOffsets![i].byteOffset = Long.fromNumber(
      indexOfChannelPayoutRecord - lengthOfVarintEncodedMessageSize(Buffer.from(channelPayoutRecord).byteLength)
    )
  }

  // set correct payload length
  payload.header.payloadLengthInBytes = payloadLengthInBytes
  // serialize payload again
  const serializedPayload = CreatorPayoutPayload.encode(payload).finish()
  return serializedPayload
}

/**
 * Generate merkle root from the serialized payload
 * @param inputFilePath path to protobuf serialized payload file
 * @returns merkle root of the cashout vector
 */
export async function generateMerkleRoot(inputFilePath: string): Promise<string> {
  const serializedHeader = await serializedPayloadHeader(inputFilePath)
  const header = CreatorPayoutPayload.Header.decode(serializedHeader)

  // Any payout record can be used to generate the merkle root,
  // here first record from creator payouts payload is used
  const recordByteOffset = header.creatorPayoutByteOffsets.shift()!.byteOffset.toNumber()
  const record = await creatorPayoutRecordAtByteOffset(inputFilePath, recordByteOffset)
  return generateMerkleRootFromCreatorPayout(record)
}

/**
 * Generate merkle root from branch of creator payout record
 * @param creatorPayout create payout record
 * @returns merkle root of the cashout vector
 */
export function generateMerkleRootFromCreatorPayout(creatorPayout: CreatorPayoutPayload.Body.CreatorPayout): string {
  // item = c_i||p_i||m_i
  const item =
    creatorPayout.channelId.toString() +
    creatorPayout.cumulativePayoutOwed.toString() +
    blake2AsHex(creatorPayout.payoutRationale)

  const merkleRoot = creatorPayout.merkleBranch.reduce((hashV, el) => {
    if (el.side === CreatorPayoutPayload.Body.CreatorPayout.Side.Right) {
      return blake2AsHex(hashV + el.hash)
    } else return blake2AsHex(el.hash + hashV)
  }, blake2AsHex(item))

  return merkleRoot
}

/**
 * fetch creator payouts payload from remote source
 * @param context `Header | Body` based on part to be fetch from remote source
 * @param offset If `context` arg is `Body` then offset of payload record must be provided
 **/
async function fetchCreatorPayout(
  context: PayloadContext,
  offset?: number
): Promise<CreatorPayoutPayload.Header | CreatorPayoutPayload.Body.CreatorPayout> {
  // HTTP Url of remote host where payload is stored
  let url = process.env.CREATOR_PAYOUT_DATA_URL as string
  if (_.isEmpty(url)) {
    throw new Error('cannot fetch creator payouts data, remote url does not exist')
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
