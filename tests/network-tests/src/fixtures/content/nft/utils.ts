import { IMember } from '../createMembers'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'
import { assert } from 'chai'
import { OwnedNftFieldsFragment } from '../../../graphql/generated/queries'

export async function assertAuctionAndBids(query: QueryNodeApi, videoId: number, topBidder: IMember): Promise<void> {
  await query.tryQueryWithTimeout(
    () => query.ownedNftByVideoId(videoId.toString()),
    (ownedNft) => {
      Utils.assert(ownedNft, 'NFT not found')
      Utils.assert(ownedNft.transactionalStatusAuction, 'NFT not in Auction state')
      Utils.assert(ownedNft.transactionalStatusAuction.bids, 'Bids not found')
      Utils.assert(ownedNft.transactionalStatusAuction.topBid, 'Top bid not found')
      assert.equal(
        ownedNft.transactionalStatusAuction.topBid.bidder.id,
        topBidder.memberId.toString(),
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
