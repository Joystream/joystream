import { ChannelPayoutsMetadata, IChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { asValidatedMetadata, readBytesFromFile, ReadFileContext } from '@joystreamjs/utils'
import { ChannelPayoutProof } from '@joystreamjs/utils/typings/ChannelPayoutsPayload.schema'
import { ChannelPayoutsVector } from '@joystreamjs/utils/typings/ChannelPayoutsVector.schema'
import { u8aToHex } from '@polkadot/util'
import { blake2AsU8a } from '@polkadot/util-crypto'
import BN from 'bn.js'
import Long from 'long'
import { MerkleTree } from 'merkletreejs'
import { Reader, Writer } from 'protobufjs'

export const hashFunc = blake2AsU8a

type MerkleProof = {
  position: 'left' | 'right'
  data: Buffer
}[]

/**
 * Get Payout Proof for given channel from
 * remote source or file
 * @param context "PATH" | "URL"
 * @param pathOrUrl
 * @param channelId Id of the channel
 * @returns payout proof record for given channel Id
 */
export async function channelPayoutProof(
  context: ReadFileContext,
  pathOrUrl: string,
  channelId: number
): Promise<ChannelPayoutsMetadata.Body.ChannelPayoutProof> {
  const serializedHeader = await serializedPayloadHeader(context, pathOrUrl)
  const header = ChannelPayoutsMetadata.Header.decode(serializedHeader)

  const channelPayoutProofOffset = header.channelPayoutByteOffsets.find((o) => o.channelId === channelId)
  if (!channelPayoutProofOffset) {
    throw new Error(`No payout Proof exists for channel id ${channelId}`)
  }

  return channelPayoutProofAtByteOffset(context, pathOrUrl, Number(channelPayoutProofOffset.byteOffset))
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
 * message as `varint_encoded_message_size+serialized_message` e.g., for serialized
 * message of 10 bytes, protobuf encoded message would look like: `0a+0b0c0d0e0f1a1b1c1d1e`.
 * Since `size` of example message is encoded in 1 byte so the function will return 1.
 * @param protobufMessageLength length of serialized message in number of bytes
 * @return length of varint encoded message size in number of bytes
 */
function lengthOfVarintEncodedMessageSize(protobufMessageLength: number): number {
  return Writer.create().uint32(protobufMessageLength).finish().byteLength
}

/**
 * We don't have any prior knowledge of how many bytes are used to encode the size information of the message,
 * so we arbitrary read `n` bytes from the payload based on the assumption that the size of the header CAN BE
 * encoded in `n` bytes. For reference, if serialized message is over 4 TB then its size information can be
 * encoded in just 6 bytes
 * @param context "PATH" | "URL"
 * @param pathOrUrl path to protobuf serialized payload file
 * @param messageOffset byte offset of message in serialized payload
 * @returns length of serialized message in number of bytes
 */
async function lengthOfProtobufMessage(
  context: ReadFileContext,
  pathOrUrl: string,
  messageOffset: number
): Promise<number> {
  // TODO: improve the implementation by reading size info byte by byte
  // TODO: and checking most significant bit (msb) of each byte.
  const arbitraryBytes = await readBytesFromFile(context, pathOrUrl, messageOffset, messageOffset + 10)
  const lengthOfMessage = Reader.create(arbitraryBytes).uint32()
  return lengthOfMessage
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
 * Get serialized payload header from a local file.
 * @param context "PATH" | "URL"
 * @param pathOrUrl path to protobuf serialized payload file
 * @return bytes of payload header
 **/
export async function serializedPayloadHeader(context: ReadFileContext, pathOrUrl: string): Promise<Uint8Array> {
  // skip the first byte which is the Tag(key) of `Header` message
  const lengthOfSerializedHeader = await lengthOfProtobufMessage(context, pathOrUrl, 1)
  const lengthOfVarintEncodedHeaderSize = lengthOfVarintEncodedMessageSize(lengthOfSerializedHeader)
  const serializedHeader = await readBytesFromFile(
    context,
    pathOrUrl,
    1 + lengthOfVarintEncodedHeaderSize,
    lengthOfVarintEncodedHeaderSize + lengthOfSerializedHeader
  )

  return serializedHeader
}

/**
 * Get channel payout Proof from local serialized payload file.
 * @param context "PATH" | "URL"
 * @param pathOrUrl path to protobuf serialized payload file
 * @param byteOffset byte offset of channel payout Proof in serialized payload
 * @return channel payout Proof
 **/
export async function channelPayoutProofAtByteOffset(
  context: ReadFileContext,
  pathOrUrl: string,
  byteOffset: number
): Promise<ChannelPayoutsMetadata.Body.ChannelPayoutProof> {
  const lengthOfSerializedProof = await lengthOfProtobufMessage(context, pathOrUrl, byteOffset)
  const lengthOfVarintEncodedProofSize = lengthOfVarintEncodedMessageSize(lengthOfSerializedProof)
  const serializedPayoutProof = await readBytesFromFile(
    context,
    pathOrUrl,
    byteOffset + lengthOfVarintEncodedProofSize,
    byteOffset + lengthOfSerializedProof + 1
  )
  const proof = ChannelPayoutsMetadata.Body.ChannelPayoutProof.decode(serializedPayoutProof)
  return proof
}

/**
 * Generate merkle root from the serialized payload
 * @param context "PATH" | "URL"
 * @param pathOrUrl path to protobuf serialized payload file
 * @returns merkle root of the cashout vector
 */
export async function generateCommitmentFromPayloadFile(context: ReadFileContext, pathOrUrl: string): Promise<string> {
  const serializedHeader = await serializedPayloadHeader(context, pathOrUrl)
  const header = ChannelPayoutsMetadata.Header.decode(serializedHeader)

  // Any payout Proof can be used to generate the merkle root,
  // here first Proof from channel payouts payload is used
  const ProofByteOffset = header.channelPayoutByteOffsets.shift()!.byteOffset.toNumber()
  const proof = await channelPayoutProofAtByteOffset(context, pathOrUrl, ProofByteOffset)
  return verifyChannelPayoutProof(proof)
}

/**
 * Generate merkle root from branch of a channel payout proof
 * @param proof channel payout proof record
 * @returns commitment (merkle root) of the cashout payload
 */
export function verifyChannelPayoutProof(proof: ChannelPayoutsMetadata.Body.ChannelPayoutProof): string {
  // item = c_i||p_i||m_i
  const item = hashFunc(
    Buffer.concat([
      createType('u64', proof.channelId).toU8a(),
      createType('u128', new BN(proof.cumulativeRewardEarned)).toU8a(),
      Buffer.from(proof.reason, 'hex'),
    ])
  )

  const merkleRoot = proof.merkleBranch.reduce((res, proofElement) => {
    if (proofElement.side === ChannelPayoutsMetadata.Body.ChannelPayoutProof.Side.Right) {
      return hashFunc(Buffer.concat([res, Buffer.from(proofElement.hash, 'hex')]))
    } else {
      return hashFunc(Buffer.concat([Buffer.from(proofElement.hash, 'hex'), res]))
    }
  }, item)

  return u8aToHex(merkleRoot)
}

export function generateJsonPayloadFromPayoutsVector(
  channelPayoutsVector: ChannelPayoutsVector
): [string, ChannelPayoutProof[]] {
  const generateLeaf = (p: ChannelPayoutsVector[number]) => {
    return hashFunc(
      Buffer.concat([
        createType('u64', p.channelId).toU8a(),
        createType('u128', new BN(p.cumulativeRewardEarned)).toU8a(),
        hashFunc(createType('Bytes', p.reason).toU8a()),
      ])
    )
  }
  const leaves = channelPayoutsVector.map(generateLeaf)

  const tree = new MerkleTree(leaves, hashFunc)

  const channelPayouts = channelPayoutsVector.map((p, i) => {
    // merkle proof for each Payout
    const merkleProof: MerkleProof = tree.getProof(Buffer.from(leaves[i]))

    const merkleBranch = merkleProof.map(({ data, position }) => {
      return {
        hash: data.toString('hex'),
        side: position === 'left' ? 0 : 1,
      }
    })

    return {
      channelId: p.channelId,
      cumulativeRewardEarned: p.cumulativeRewardEarned,
      merkleBranch,
      reason: Buffer.from(hashFunc(createType('Bytes', p.reason).toU8a())).toString('hex'),
    } as ChannelPayoutProof
  })

  return [tree.getHexRoot(), channelPayouts]
}

/**
 * Generate serialized payload from JSON encoded channel payouts.
 * @param channelPayoutProofs JSON object containing channel payout proofs
 * @returns serialized channel payouts payload
 */
export function generateSerializedPayload(channelPayoutProofs: ChannelPayoutProof[]): Uint8Array {
  if (channelPayoutProofs.length === 0) throw new Error('payload is empty')

  const numberOfChannels = channelPayoutProofs.length
  const headerLengthInBytes = Long.fromNumber(lengthOfHeader(numberOfChannels))
  const channelPayoutByteOffsets: ChannelPayoutsMetadata.Header.IChannelPayoutByteOffset[] = []
  const body = asValidatedMetadata(ChannelPayoutsMetadata.Body, { channelPayouts: channelPayoutProofs })

  // Length of Header is known prior to serialization since its fields are fixed size, however the
  // length of the COMPLETE payload can only be known after it has been serialized since Body fields
  // are varint encoded.
  // So we can't set payload length & byte offsets, to resolve this issue payload will be serialized
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
    const channelPayoutProof = ChannelPayoutsMetadata.Body.ChannelPayoutProof.encode(body.channelPayouts![i]).finish()
    const indexOfChannelPayoutProof = serializedPayloadWithEmptyHeaderFields.indexOf(channelPayoutProof)
    // set correct byteOffsets
    payload.header.channelPayoutByteOffsets![i].byteOffset = Long.fromNumber(
      indexOfChannelPayoutProof - lengthOfVarintEncodedMessageSize(Buffer.from(channelPayoutProof).byteLength)
    )
  }

  // set correct payload length
  payload.header.payloadLengthInBytes = payloadLengthInBytes
  // serialize payload again
  const serializedPayload = ChannelPayoutsMetadata.encode(payload).finish()
  return serializedPayload
}
