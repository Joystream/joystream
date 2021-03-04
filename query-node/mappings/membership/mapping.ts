
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

    const member = new Membership({
        id: memberId.toString(),
        rootAccount: accountId.toString(),
        controllerAccount: accountId.toString(),
        handle: convertBytesToString(handle.unwrap()),
        about: convertBytesToString(about.unwrap()),
        avatarUri: convertBytesToString(avatarUri.unwrap()),
        registeredAtBlock: block,
        // TODO: upgrade indexer-lib which support block timestamp: substrateEvent.timestamp
        registeredAtTime: new Date(),
        entry: EntryMethod.PAID, // TODO?: callArgs.paidTermsId
        suspended: false,
      })
    
      await db.save<Membership>(member)
    }
    
export async function members_MemberUpdatedAboutText(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
    const { text, memberId } = new Members.ChangeMemberAboutTextCall(event_).args

    const member = await getMemberById(db, memberId)
    member.about = convertBytesToString(text)
    await db.save<Membership>(member)
}

export async function members_MemberUpdatedAvatar(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
    const { uri, memberId } = new Members.ChangeMemberAvatarCall(event_).args
  
    const member = await getMemberById(db, memberId)
    member.avatarUri = convertBytesToString(uri)
    await db.save<Membership>(member)
  }

export async function members_MemberUpdatedHandle(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
    const { handle, memberId } = new Members.ChangeMemberHandleCall(event_).args

    const member = await getMemberById(db, memberId)
    member.handle = convertBytesToString(handle)
    await db.save<Membership>(member)
}