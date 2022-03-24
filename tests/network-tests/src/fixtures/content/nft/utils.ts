import { IMember } from '../createMembers'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'
import { assert } from 'chai'
import { OwnedNftFieldsFragment } from '../../../graphql/generated/queries'

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
