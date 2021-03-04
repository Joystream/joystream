
import BN from 'bn.js'
import { Bytes } from '@polkadot/types'
import { MemberId } from '@joystream/types/members'
import { DatabaseManager, SubstrateEvent } from '@dzlzv/hydra-indexer-lib/lib'

import { Members } from '../generated/types'
import { EntryMethod, Membership } from '../generated/graphql-server/src/modules/membership/membership.model'
import { Block, Network } from '../generated/graphql-server/src/modules/block/block.model'

async function getMemberById(db: DatabaseManager, id: MemberId): Promise<Membership> {
    const member = await db.get(Membership, { where: { id: id.toString() } })
    if (!member) throw Error(`Member(${id}) not found`)
    return member
  }

function convertBytesToString(b: Bytes): string {
    return Buffer.from(b.toU8a(true)).toString()
}

export async function members_MemberRegistered(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
    const { accountId, memberId } = new Members.MemberRegisteredEvent(event_).data
    const { avatarUri, about, handle } = new Members.BuyMembershipCall(event_).args
  
    let block = await db.get(Block, { where: { block: event_.blockNumber } })
  
    if (!block) {
      block = new Block({
        network: Network.BABYLON,
        block: event_.blockNumber,
        // TODO: upgrade indexer-lib which support block timestamp: substrateEvent.timestamp
        timestamp: new BN(Date.now()),
      })
      await db.save<Block>(block)
    }