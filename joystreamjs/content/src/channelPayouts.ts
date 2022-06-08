import { ChannelPayoutsMetadata, IChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { Hash } from '@joystream/types/common'
import { ProofElement, Side } from '@joystream/types/content'
import { asValidatedMetadata, getByteSequenceFromFile } from '@joystreamjs/utils'
import { ChannelPayoutsVector } from '@joystreamjs/utils/typings/ChannelPayoutsVector.schema'
import { blake2AsHex } from '@polkadot/util-crypto'
import axios from 'axios'
import _ from 'lodash'
import Long from 'long'
import { MerkleTree } from 'merkletreejs'
import { Reader, Writer } from 'protobufjs'

const PAYLOAD_CONTEXT = ['Header', 'Body'] as const
type PayloadContext = typeof PAYLOAD_CONTEXT[number]

type ChannelPayouts = ChannelPayout[]
export interface ChannelPayout {
  channelId: number
  cumulativePayoutEarned: number
  merkleBranch: ProofElement[]
  payoutRationale: string
}

type MerkleProof = {
  position: 'left' | 'right'
  data: Buffer
}[]

/**
 * Get Payout Record for given channel Id. It uses the `fetchChannelPayout`
 * function to retrieve the record from remote source
 * @param channelId Id of the channel
 * @returns payout record for given channel Id
 */
export async function channelPayoutRecord(channelId: number): Promise<ChannelPayoutsMetadata.Body.ChannelPayout> {
  const header = (await fetchChannelPayout('Header')) as ChannelPayoutsMetadata.Header
  if (!header.channelPayoutByteOffsets.length) {
    throw new Error('No payout record exists')
  }

  const channelPayoutRecordOffset = header.channelPayoutByteOffsets.find(
    (payoutOffset) => payoutOffset.channelId === channelId
  )
  if (!channelPayoutRecordOffset) {
    throw new Error(`No payout record exists for channel with channel id ${channelId}`)
  }

  const channelPayoutRecord = (await fetchChannelPayout(
    'Body',
    channelPayoutRecordOffset.byteOffset.toNumber()
  )) as ChannelPayoutsMetadata.Body.ChannelPayout

  return channelPayoutRecord
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
 * Get channel payout record from local serialized payload file.
 * @param inputFilePath path to protobuf serialized payload file
 * @param byteOffset byte offset of channel payout record in serialized payload
 * @return channel payout record
 **/
export async function channelPayoutRecordAtByteOffset(
  inputFilePath: string,
  byteOffset: number
): Promise<ChannelPayoutsMetadata.Body.ChannelPayout> {
  const lengthOfSerializedRecord = await lengthOfSerializedMessage(inputFilePath, byteOffset)
  const lengthOfVarintEncodedRecordSize = lengthOfVarintEncodedMessageSize(lengthOfSerializedRecord)
  const serializedPayoutRecord = await getByteSequenceFromFile(
    inputFilePath,
    byteOffset + lengthOfVarintEncodedRecordSize,
    byteOffset + lengthOfSerializedRecord
  )

  return ChannelPayoutsMetadata.Body.ChannelPayout.decode(serializedPayoutRecord)
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
 * Generate serialized payload from JSON encoded channel payouts.
 * @param payloadBodyInput path to JSON file containing channel payouts
 * @returns serialized channel payouts payload
 */
export function generateSerializedPayload(payloadBodyInput: ChannelPayouts[]): Uint8Array {
  if (payloadBodyInput.length === 0) throw new Error('payload is empty')

  const numberOfChannels = payloadBodyInput.length
  const headerLengthInBytes = Long.fromNumber(lengthOfHeader(numberOfChannels))
  const channelPayoutByteOffsets: ChannelPayoutsMetadata.Header.IChannelPayoutByteOffset[] = []
  const body = asValidatedMetadata(ChannelPayoutsMetadata.Body, { channelPayouts: payloadBodyInput })

  // Length of Header is known prior to serialization since its fields are fixed size, however the
  // length of the COMPLETE payload can only be known after it has been serialized since Body fields
  // are varint encoded.
  // So we cant set payload length & byte offsets, to resolve this issue payload will be serialized
  // with empty payload length & byte offsets, and once serialized both unknowns can be obtained
  // from payload
  body.channelPayouts?.forEach(({ channelId }) => {
    channelPayoutByteOffsets.push({ channelId, byteOffset: Long.fromNumber(0) })
  })
  const payload: IChannelPayoutsMetadata = {
    header: {
      payloadLengthInBytes: Long.fromNumber(0),
      headerLengthInBytes,
      numberOfChannels,
      channelPayoutByteOffsets,
    },
    body,
  }

  const serializedPayloadWithEmptyHeaderFields = Buffer.from(ChannelPayoutsMetadata.encode(payload).finish())
  const payloadLengthInBytes = Long.fromNumber(serializedPayloadWithEmptyHeaderFields.byteLength)

  for (let i = 0; i < numberOfChannels; i++) {
    const channelPayoutRecord = ChannelPayoutsMetadata.Body.ChannelPayout.encode(body.channelPayouts![i]).finish()
    const indexOfChannelPayoutRecord = serializedPayloadWithEmptyHeaderFields.indexOf(channelPayoutRecord)
    // set correct byteOffsets
    payload.header.channelPayoutByteOffsets![i].byteOffset = Long.fromNumber(
      indexOfChannelPayoutRecord - lengthOfVarintEncodedMessageSize(Buffer.from(channelPayoutRecord).byteLength)
    )
  }

  // set correct payload length
  payload.header.payloadLengthInBytes = payloadLengthInBytes
  // serialize payload again
  const serializedPayload = ChannelPayoutsMetadata.encode(payload).finish()
  return serializedPayload
}

/**
 * Generate merkle root from the serialized payload
 * @param inputFilePath path to protobuf serialized payload file
 * @returns merkle root of the cashout vector
 */
export async function generateCommitmentFromPayloadFile(inputFilePath: string): Promise<string> {
  const serializedHeader = await serializedPayloadHeader(inputFilePath)
  const header = ChannelPayoutsMetadata.Header.decode(serializedHeader)

  // Any payout record can be used to generate the merkle root,
  // here first record from channel payouts payload is used
  const recordByteOffset = header.channelPayoutByteOffsets.shift()!.byteOffset.toNumber()
  const record = await channelPayoutRecordAtByteOffset(inputFilePath, recordByteOffset)
  return generateCommitmentFromPayload(record)
}

/**
 * Generate merkle root from branch of channel payout record
 * @param channelPayoutsPayload create payout record
 * @returns merkle root of the cashout vector
 */
export function generateCommitmentFromPayload(
  channelPayoutsPayload: ChannelPayoutsMetadata.Body.ChannelPayout
): string {
  // item = c_i||p_i||m_i
  const item =
    channelPayoutsPayload.channelId.toString() +
    channelPayoutsPayload.cumulativeRewardEarned.toString() +
    blake2AsHex(channelPayoutsPayload.payoutRationale)

  const merkleRoot = channelPayoutsPayload.merkleBranch.reduce((hashV, el) => {
    if (el.side === ChannelPayoutsMetadata.Body.ChannelPayout.Side.Right) {
      return blake2AsHex(hashV + el.hash)
    } else return blake2AsHex(el.hash + hashV)
  }, blake2AsHex(item))

  return merkleRoot
}

export function generateJsonPlayloadFromPayoutsVector(channelPayoutsVector: ChannelPayoutsVector): ChannelPayout[] {
  const leaves = channelPayoutsVector.map(({ channelId, cumulativePayoutEarned, payoutRationale }) =>
    blake2AsHex(`${channelId}${cumulativePayoutEarned}${blake2AsHex(payoutRationale)}`)
  )
  const tree = new MerkleTree(leaves, blake2AsHex)

  const channelPayouts = channelPayoutsVector.map((p, i) => {
    // merkle proof for each record
    const merkleProof: MerkleProof = tree.getProof(leaves[i])

    const merkleBranch = merkleProof.map(({ data, position }) => {
      return createType<ProofElement, 'ProofElement'>('ProofElement', {
        hash: createType<Hash, 'Hash'>('Hash', data),
        side: createType<Side, 'Side'>('Side', position === 'left' ? { Left: null } : { Right: null }),
      })
    })

    return {
      channelId: p.channelId,
      cumulativePayoutEarned: p.cumulativePayoutEarned,
      merkleBranch,
      payoutRationale: blake2AsHex(p.payoutRationale),
    } as ChannelPayout
  })

  return channelPayouts
}

/**
 * fetch channel payouts payload from remote source
 * @param context `Header | Body` based on part to be fetch from remote source
 * @param offset If `context` arg is `Body` then offset of payload record must be provided
 **/
async function fetchChannelPayout(
  context: PayloadContext,
  offset?: number
): Promise<ChannelPayoutsMetadata.Header | ChannelPayoutsMetadata.Body.ChannelPayout> {
  // HTTP Url of remote host where payload is stored
  let url = process.env.Channel_PAYOUT_DATA_URL as string
  if (_.isEmpty(url)) {
    throw new Error('cannot fetch channel payouts data, remote url does not exist')
  }

  if (context === 'Header') {
    url = `${url}?header`
  } else if (context === 'Body' && offset !== undefined) {
    url = `${url}?offset=${offset}`
  } else throw new Error('Invalid fetch channel payout parameters')

  const response = await axios.get(url, {
    headers: {
      responseType: 'arraybuffer',
    },
  })
  if (response.status !== 200) {
    throw new Error('invalid response while fetching channel payout data')
  }

  const responseBuffer = Buffer.from(response.data)
  if (context === 'Header') {
    return ChannelPayoutsMetadata.Header.decode(responseBuffer)
  } else return ChannelPayoutsMetadata.Body.ChannelPayout.decode(responseBuffer)
}
