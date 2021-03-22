/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { MemberId } from '@joystream/types/common'
import { Membership, MembershipEntryMethod } from 'query-node/dist/src/modules/membership/membership.model'
import { Members } from './generated/types'
import { prepareBlock } from './common'
import BN from 'bn.js'
import { Block } from 'query-node/dist/src/modules/block/block.model'

async function getMemberById(db: DatabaseManager, id: MemberId): Promise<Membership> {
  const member = await db.get(Membership, { where: { id: id.toString() } })
  if (!member) throw Error(`Member(${id}) not found`)
  return member
}

export async function members_MembershipBought(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId } = new Members.MembershipBoughtEvent(event_).data
  const {
    name,
    handle,
    avatar_uri: avatarUri,
    about,
    root_account: rootAccount,
    controller_account: controllerAccount,
    referrer_id: referrerId,
  } = new Members.BuyMembershipCall(event_).args.params
  const member = new Membership({
    id: memberId.toString(),
    name: name.unwrapOr(undefined)?.toString(),
    rootAccount: rootAccount.toString(),
    controllerAccount: controllerAccount.toString(),
    handle: handle.unwrap().toString(),
    about: about.unwrapOr(undefined)?.toString(),
    avatarUri: avatarUri.unwrapOr(undefined)?.toString(),
    registeredAtBlock: await prepareBlock(db, event_),
    registeredAtTime: new Date(event_.blockTimestamp.toNumber()),
    entry: MembershipEntryMethod.PAID,
    referrerId: referrerId.unwrapOr(undefined)?.toString(),
    isVerified: false,
  })

  await db.save<Block>(member.registeredAtBlock)
  await db.save<Membership>(member)
}

export async function members_MemberProfileUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId } = new Members.MemberProfileUpdatedEvent(event_).data
  const { name, about, avatarUri, handle } = new Members.UpdateProfileCall(event_).args
  const member = await getMemberById(db, memberId)
  if (name.isSome) {
    member.name = name.unwrap().toString()
  }
  if (about.isSome) {
    member.about = about.unwrap().toString()
  }
  if (avatarUri.isSome) {
    member.avatarUri = avatarUri.unwrap().toString()
  }
  if (handle.isSome) {
    member.handle = handle.unwrap().toString()
  }

  await db.save<Membership>(member)
}

export async function members_MemberAccountsUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId } = new Members.MemberAccountsUpdatedEvent(event_).data
  const { newRootAccount, newControllerAccount } = new Members.UpdateAccountsCall(event_).args
  const member = await getMemberById(db, memberId)
  if (newControllerAccount.isSome) {
    member.controllerAccount = newControllerAccount.unwrap().toString()
  }
  if (newRootAccount.isSome) {
    member.rootAccount = newRootAccount.unwrap().toString()
  }

  await db.save<Membership>(member)
}

export async function members_MemberVerificationStatusUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const { memberId, bool: verificationStatus } = new Members.MemberVerificationStatusUpdatedEvent(event_).data
  const member = await getMemberById(db, memberId)
  member.isVerified = verificationStatus.valueOf()

  await db.save<Membership>(member)
}
