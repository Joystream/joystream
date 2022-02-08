import { IMember } from '../createMembers'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'
import { assert } from 'chai'

export async function assertNftOwner(query: QueryNodeApi, videoId: number, winner: IMember) {
  await query.tryQueryWithTimeout(
    () => query.ownedNftByVideoId(videoId.toString()),
    (ownedNft) => {
      Utils.assert(ownedNft, 'NFT not found')
      Utils.assert(ownedNft.ownerMember, 'Invalid NFT owner')
      assert.equal(ownedNft.ownerMember.id.toString(), winner.memberId.toString())
    }
  )
}
