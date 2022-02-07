import { CreatorPayout, CreatorPayoutHeader, NonLeafNodeMerkleBranch } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { ProofElement, PullPayment, Side } from '@joystream/types/content'
import { Vec } from '@polkadot/types'
import { blake2AsHex } from '@polkadot/util-crypto'
import axios from 'axios'
import _ from 'lodash'

type IndexItem = {
  index: number
  side: Side
}

export async function channelPayoutInfo(channelId: number): Promise<CreatorPayout> {
  const header = await fetchCreatorPayoutHeader()
  if (!header.creatorPayoutByteOffsets.length) {
    throw new Error('No payout record exists')
  }

  const channelRecordOffset = header.creatorPayoutByteOffsets.find(
    (payoutOffset) => payoutOffset.channelId === channelId
  )
  if (!channelRecordOffset) {
    throw new Error(`No payout record exists for channel with channel id ${channelId}`)
  }
  return await fetchCreatorPayoutAtOffset(channelRecordOffset.byteOffset.toNumber())
}

export async function claimChannelPayout(channelId: number): Promise<void> {
  const channelRecord = await channelPayoutInfo(channelId)
  const header = await fetchCreatorPayoutHeader()

  // index of channel byte offset
  const indexOf = header.creatorPayoutByteOffsets.findIndex((payoutOffset) => payoutOffset.channelId === channelId)

  // builds the merkle path with the hashes needed for the proof
  const merkelPathIndices = merklePathIndices(header.numberOfChannels, indexOf + 1)
  const merkleProof = createMerkleProof(merkelPathIndices)

  const pullPayment = createType<PullPayment, 'PullPayment'>('PullPayment', {
    channel_id: channelId,
    cumulative_payout_claimed: channelRecord.cumulativePayoutOwed,
    reason: blake2AsHex(channelRecord.payoutRationale),
  })

  // ------------------------
  // Create Transaction code
  // ------------------------
  console.log(merkleProof, pullPayment)
  // TODO: implement create transaction
}

// can be passed a remote url or file path remotePath: string
export async function fetchCreatorPayoutHeader(): Promise<CreatorPayoutHeader> {
  const url = process.env.CREATOR_PAYOUT_DATA_URL as string
  if (_.isEmpty(url)) {
    throw new Error('cannot fetch creator payout data, remote url does not exist')
  }

  const response = await axios.get(`${url}`, {
    headers: {
      responseType: 'arraybuffer',
    },
  })
  if (response.status !== 200) {
    throw new Error('invalid response while fetching creator payout data')
  }

  const responseBuffer = Buffer.from(response.data)
  return CreatorPayoutHeader.decode(responseBuffer)
}

export async function fetchCreatorPayoutAtOffset(offset: number): Promise<CreatorPayout> {
  const url = process.env.CREATOR_PAYOUT_DATA_URL as string
  if (_.isEmpty(url)) {
    throw new Error('cannot fetch creator payout data, remote url does not exist')
  }

  const response = await axios.get(`${url}?offset=${offset}`, {
    headers: {
      responseType: 'arraybuffer',
    },
  })
  if (response.status !== 200) {
    throw new Error('invalid response while fetching creator payout data')
  }

  const responseBuffer = Buffer.from(response.data)
  return CreatorPayout.decode(responseBuffer)
}

export async function fetchMerkleBranchAtOffset(offset: number): Promise<NonLeafNodeMerkleBranch> {
  const url = process.env.CREATOR_PAYOUT_DATA_URL as string
  if (_.isEmpty(url)) {
    throw new Error('cannot fetch creator payout data, remote url does not exist')
  }

  const response = await axios.get(`${url}?offset=${offset}`, {
    headers: {
      responseType: 'arraybuffer',
    },
  })
  if (response.status !== 200) {
    throw new Error('invalid response while fetching creator payout data')
  }

  const responseBuffer = Buffer.from(response.data)
  return CreatorPayout.decode(responseBuffer)
}

// helper function to generate the correct sequence of indexes used to
// construct the merkle path necessary for membership proof
async function createMerkleProof(indices: IndexItem[]): Promise<Vec<ProofElement>> {
  const merkleProof = ([] as unknown) as Vec<ProofElement>
  const header = await fetchCreatorPayoutHeader()
  const channelSiblingIndex = indices.shift() as IndexItem
  const channelSiblingOffset = header.creatorPayoutByteOffsets[channelSiblingIndex.index]
  const merkleBranchOfSibling = (await fetchCreatorPayoutAtOffset(channelSiblingOffset.byteOffset.toNumber()))
    .merkleBranch

  merkleProof.push(
    createType<ProofElement, 'ProofElement'>('ProofElement', {
      hash: merkleBranchOfSibling,
      side: channelSiblingIndex.side,
    })
  )
  indices.map(async ({ index, side }) => {
    const merkleBranchOffset = header.nonLeafNodeMerkleBranchByteOffsets[index - header.numberOfChannels]
    const merkleBranch = (await fetchMerkleBranchAtOffset(merkleBranchOffset.byteOffset.toNumber())).merkleBranch
    merkleProof.push(
      createType<ProofElement, 'ProofElement'>('ProofElement', {
        hash: merkleBranch,
        side: side,
      })
    )
  })
  return merkleProof
}

// helper function to generate the sequence of indexes
// used to construct the path for merkle proof. Reference
// code: https://github.com/Joystream/joystream/blob/runtime-modules/content/src/tests/fixtures.rs#L1545
function merklePathIndices(len: number, index: number): IndexItem[] {
  let idx = index
  if (index <= 0) {
    // index starting at 0
    throw new Error('index must be positive')
  }
  const floor2 = (x: number) => x / 2 + (x % 2)
  const path: IndexItem[] = []
  let prevLen = 0
  let el = len

  while (el !== 1) {
    if (idx % 2 === 1 && idx === el) {
      path.push({
        index: prevLen + idx,
        side: createType<Side, 'Side'>('Side', { Left: null }),
      })
    } else {
      if (idx % 2 === 1) {
        path.push({
          index: prevLen + idx + 1,
          side: createType<Side, 'Side'>('Side', { Right: null }),
        })
      } else {
        path.push({
          index: prevLen + idx - 1,
          side: createType<Side, 'Side'>('Side', { Left: null }),
        })
      }
    }
    prevLen += el
    idx = floor2(idx)
    el = floor2(el)
  }
  return path
}
