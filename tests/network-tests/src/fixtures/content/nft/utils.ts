import { IMember } from '../createMembers'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'
import { assert } from 'chai'
import { OwnedNftFieldsFragment } from '../../../graphql/generated/queries'

export type Maybe<T> = T | null
export interface NftOwnerInEventEntity {
  ownerMember?: Maybe<{ id: string }>
  ownerCuratorGroup?: Maybe<{ id: string }>
}

export async function assertAuctionAndBids(query: QueryNodeApi, videoId: number, topBidder: IMember): Promise<void> {
  await query.tryQueryWithTimeout(
    () => query.ownedNftByVideoId(videoId.toString()),
    (ownedNft) => {
      Utils.assert(ownedNft, 'NFT not found')
      Utils.assert(ownedNft.transactionalStatus.__typename === 'TransactionalStatusAuction', 'NFT not in Auction state')
      Utils.assert(ownedNft.transactionalStatus.auction, 'NFT Auction not found')
      Utils.assert(ownedNft.transactionalStatus.auction.bids, 'Bids not found')
      Utils.assert(ownedNft.transactionalStatus.auction.topBid, 'Top bid not found')
      assert.equal(
        ownedNft.transactionalStatus.auction.topBid.bidder.id,
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
