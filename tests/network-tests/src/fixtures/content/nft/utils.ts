import { IMember } from '../createMembers'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'
import { assert } from 'chai'
import { OwnedNftFieldsFragment } from '../../../graphql/generated/queries'

export async function assertAuctionAndBids(query: QueryNodeApi, videoId: number, lastBidder: IMember): Promise<void> {
  await query.tryQueryWithTimeout(
    () => query.ownedNftByVideoId(videoId.toString()),
    (ownedNft) => {
      Utils.assert(ownedNft, 'NFT not found')
      Utils.assert(ownedNft.transactionalStatus.__typename === 'TransactionalStatusAuction', 'NFt not in Auction state')
      Utils.assert(ownedNft.transactionalStatus.auction, 'NFT Auction not found')
      Utils.assert(ownedNft.transactionalStatus.auction.bids, 'Bids not found')
      Utils.assert(ownedNft.transactionalStatus.auction.lastBid, 'Last bid not found')
      assert.equal(
        ownedNft.transactionalStatus.auction.lastBid.bidder.id,
        lastBidder.memberId.toString(),
        'Invalid last bidder'
      )
    }
  )
}

export async function assertNftOwner(
  query: QueryNodeApi,
  videoId: number,
  owner: IMember,
  customAsserts?: (ownedNft: OwnedNftFieldsFragment) => void
) {
  await query.tryQueryWithTimeout(
    () => query.ownedNftByVideoId(videoId.toString()),
    (ownedNft) => {
      Utils.assert(ownedNft, 'NFT not found')
      Utils.assert(ownedNft.ownerMember, 'Invalid NFT owner')
      assert.equal(ownedNft.ownerMember.id.toString(), owner.memberId.toString())
      Utils.assert(ownedNft.creatorChannel.id, 'NFT creator channel id not found')

      if (customAsserts) {
        customAsserts(ownedNft)
      }
    }
  )
}
