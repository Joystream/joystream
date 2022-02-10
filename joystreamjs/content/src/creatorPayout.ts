import { CreatorPayoutPayload } from '@joystream/metadata-protobuf'
import { blake2AsU8a } from '@polkadot/util-crypto'
import axios from 'axios'
import _ from 'lodash'

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
