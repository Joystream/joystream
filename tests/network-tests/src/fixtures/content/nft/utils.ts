import { IMember } from '../createMembersAndCurators'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'
import { assert } from 'chai'
import { OwnedNftFieldsFragment } from '../../../graphql/generated/queries'

export type Maybe<T> = T | null
export interface NftOwnerInEventEntity {
  ownerMember?: Maybe<{ id: string }>
  ownerCuratorGroup?: Maybe<{ id: string }>
}

export async function assertAuctionAndBids(
  query: QueryNodeApi,
  videoId: number,
  topBidder: IMember,
  plannedEndAtBlock?: number
): Promise<void> {
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
      if (plannedEndAtBlock !== undefined) {
        Utils.assert(ownedNft.transactionalStatusAuction.auctionType.__typename === 'AuctionTypeEnglish')
        assert.equal(
          ownedNft.transactionalStatusAuction.auctionType.plannedEndAtBlock,
          plannedEndAtBlock,
          'Unexpected english auction planned end block'
        )
      }
    }
  )
}

export async function ensureMemberOpenAuctionBidsAreCancelled(
  query: QueryNodeApi,
  videoId: number,
  member: IMember
): Promise<void> {
  await query.tryQueryWithTimeout(
    () => query.bidsByMemberId(videoId.toString(), member.memberId.toString()),
    (bids) => {
      bids.forEach((bid) => {
        if (bid.auction.auctionType.__typename === 'AuctionTypeOpen') {
          assert.equal(bid.isCanceled, true, `Some bid by member ${member} on nft ${videoId} are uncancelled`)
        }
      })
    }
  )
}

export async function assertNftOwner(
  query: QueryNodeApi,
  videoId: number,
  owner: IMember,
  customAsserts?: (ownedNft: OwnedNftFieldsFragment) => void
): Promise<void> {
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

export async function assertNftEventContentActor(
  query: QueryNodeApi,
  eventQuery: () => Promise<NftOwnerInEventEntity[]>,
  ownerId: string,
  ownerContext: 'Member' | 'CuratorGroup'
): Promise<void> {
  await query.tryQueryWithTimeout(
    () => eventQuery(),
    ([nftEvent]) => {
      Utils.assert(nftEvent, 'NFT event not found')
      if (ownerContext === 'Member') {
        Utils.assert(nftEvent.ownerMember, 'NFT ownerMember not found in event')
        assert.equal(nftEvent.ownerMember.id.toString(), ownerId.toString(), 'Invalid NFT ownerMember in event')
      }

      if (ownerContext === 'CuratorGroup') {
        Utils.assert(nftEvent.ownerCuratorGroup, 'NFT ownerCuratorGroup not found in event')
        assert.equal(
          nftEvent.ownerCuratorGroup.id.toString(),
          ownerId.toString(),
          'Invalid NFT ownerCuratorGroup in event'
        )
      }
    }
  )
}
