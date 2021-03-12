import BN from 'bn.js'
import { Bytes } from '@polkadot/types'
import { MemberId } from '@joystream/types/members'
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import { prepareBlock } from './common'
import { Members } from '../generated/types'
import { MembershipEntryMethod, Membership } from 'query-node/dist/src/modules/membership/membership.model'
import { Block } from 'query-node/dist/src/modules/block/block.model'

async function getMemberById(db: DatabaseManager, id: MemberId): Promise<Membership> {
  const member = await db.get(Membership, { where: { id: id.toString() } })
  if (!member) throw Error(`Member(${id}) not found`)
  return member
}

function convertBytesToString(b: Bytes): string {
  return Buffer.from(b.toU8a(true)).toString()
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberRegistered(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { accountId, memberId } = new Members.MemberRegisteredEvent(event_).data
  const { avatarUri, about, handle } = new Members.BuyMembershipCall(event_).args

  const member = new Membership({
    id: memberId.toString(),
    rootAccount: accountId.toString(),
    controllerAccount: accountId.toString(),
    handle: convertBytesToString(handle.unwrap()),
    about: convertBytesToString(about.unwrap()),
    avatarUri: convertBytesToString(avatarUri.unwrap()),
    registeredAtBlock: await prepareBlock(db, event_),
    // TODO: upgrade indexer-lib which support block timestamp: substrateEvent.timestamp
    registeredAtTime: new Date(event_.blockTimestamp.toNumber()),
    entry: MembershipEntryMethod.PAID, // TODO?: callArgs.paidTermsId
  })

  await db.save<Membership>(member)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedAboutText(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { text, memberId } = new Members.ChangeMemberAboutTextCall(event_).args

  const member = await getMemberById(db, memberId)
  member.about = convertBytesToString(text)
  await db.save<Membership>(member)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedAvatar(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { uri, memberId } = new Members.ChangeMemberAvatarCall(event_).args

  const member = await getMemberById(db, memberId)
  member.avatarUri = convertBytesToString(uri)
  await db.save<Membership>(member)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedHandle(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { handle, memberId } = new Members.ChangeMemberHandleCall(event_).args

  const member = await getMemberById(db, memberId)
  member.handle = convertBytesToString(handle)
  await db.save<Membership>(member)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberSetRootAccount(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { newRootAccount, memberId } = new Members.SetRootAccountCall(event_).args

  const member = await getMemberById(db, memberId)
  member.rootAccount = newRootAccount.toString()
  await db.save<Membership>(member)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberSetControllerAccount(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { newControllerAccount, memberId } = new Members.SetControllerAccountCall(event_).args

  const member = await getMemberById(db, memberId)
  member.controllerAccount = newControllerAccount.toString()
  await db.save<Membership>(member)
}
