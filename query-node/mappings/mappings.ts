/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { Membership, MembershipEntryMethod } from 'query-node/dist/src/modules/membership/membership.model'
import { Members } from './generated/types'
import { prepareBlock } from './common'
import BN from 'bn.js'
import { Block } from 'query-node/dist/src/modules/block/block.model'
import { Bytes } from '@polkadot/types'
import { MembershipSystem } from 'query-node/dist/src/modules/membership-system/membership-system.model'
import { MemberId, BuyMembershipParameters, InviteMembershipParameters } from '@joystream/types/augment/all'

async function getMemberById(db: DatabaseManager, id: MemberId): Promise<Membership> {
  const member = await db.get(Membership, { where: { id: id.toString() } })
  if (!member) {
    throw new Error(`Member(${id}) not found`)
  }
  return member
}

async function getMembershipSystem(db: DatabaseManager) {
  const membershipSystem = await db.get(MembershipSystem, {})
  if (!membershipSystem) {
    throw new Error(`Membership system entity not found! Forgot to run "yarn workspace query-node-root db:init"?`)
  }
  return membershipSystem
}

function bytesToString(b: Bytes): string {
  return Buffer.from(b.toU8a(true)).toString()
}

async function newMembershipFromParams(
  db: DatabaseManager,
  event_: SubstrateEvent,
  memberId: MemberId,
  entryMethod: MembershipEntryMethod,
  params: BuyMembershipParameters | InviteMembershipParameters
): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const membershipSystem = await getMembershipSystem(db)
  const {
    name,
    root_account: rootAccount,
    controller_account: controllerAccount,
    handle,
    about,
    avatar_uri: avatarUri,
  } = params
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
    entry: entryMethod,
    referredBy:
      entryMethod === MembershipEntryMethod.PAID && (params as BuyMembershipParameters).referrer_id.isSome
        ? new Membership({ id: (params as BuyMembershipParameters).referrer_id.unwrap().toString() })
        : undefined,
    isVerified: false,
    inviteCount: membershipSystem.defaultInviteCount,
    boundAccounts: [],
    invitees: [],
    referredMembers: [],
    invitedBy:
      entryMethod === MembershipEntryMethod.INVITED
        ? new Membership({ id: (params as InviteMembershipParameters).inviting_member_id.toString() })
        : undefined,
  })

  await db.save<Block>(member.registeredAtBlock)
  await db.save<Membership>(member)
}

export async function members_MembershipBought(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, buyMembershipParameters } = new Members.MembershipBoughtEvent(event_).data
  await newMembershipFromParams(db, event_, memberId, MembershipEntryMethod.PAID, buyMembershipParameters)
}

export async function members_MemberProfileUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId } = new Members.MemberProfileUpdatedEvent(event_).data
  const { name, about, avatarUri, handle } = new Members.UpdateProfileCall(event_).args
  const member = await getMemberById(db, memberId)
  if (name.isSome) {
    member.name = bytesToString(name.unwrap())
  }
  if (about.isSome) {
    member.about = bytesToString(about.unwrap())
  }
  if (avatarUri.isSome) {
    member.avatarUri = bytesToString(avatarUri.unwrap())
  }
  if (handle.isSome) {
    member.handle = bytesToString(handle.unwrap())
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

export async function members_InvitesTransferred(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const {
    memberIds: { 0: sourceMemberId, 1: targetMemberId },
    u32: numberOfInvites,
  } = new Members.InvitesTransferredEvent(event_).data
  const sourceMember = await getMemberById(db, sourceMemberId)
  const targetMember = await getMemberById(db, targetMemberId)
  sourceMember.inviteCount -= numberOfInvites.toNumber()
  targetMember.inviteCount += numberOfInvites.toNumber()

  await db.save<Membership>(sourceMember)
  await db.save<Membership>(targetMember)
}

export async function members_MemberInvited(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, inviteMembershipParameters } = new Members.MemberInvitedEvent(event_).data
  await newMembershipFromParams(db, event_, memberId, MembershipEntryMethod.INVITED, inviteMembershipParameters)

  // Decrease invite count of inviting member
  const invitingMember = await getMemberById(db, inviteMembershipParameters.inviting_member_id)
  invitingMember.inviteCount -= 1
  await db.save<Membership>(invitingMember)
}

export async function members_StakingAccountConfirmed(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, accountId } = new Members.StakingAccountConfirmedEvent(event_).data
  const member = await getMemberById(db, memberId)
  member.boundAccounts.push(accountId.toString())

  await db.save<Membership>(member)
}

export async function members_StakingAccountRemoved(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, accountId } = new Members.StakingAccountRemovedEvent(event_).data
  const member = await getMemberById(db, memberId)
  member.boundAccounts.splice(
    member.boundAccounts.findIndex((a) => a === accountId.toString()),
    1
  )

  await db.save<Membership>(member)
}

export async function members_InitialInvitationCountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const { u32: newDefaultInviteCount } = new Members.InitialInvitationCountUpdatedEvent(event_).data
  const membershipSystem = await getMembershipSystem(db)
  membershipSystem.defaultInviteCount = newDefaultInviteCount.toNumber()

  await db.save<MembershipSystem>(membershipSystem)
}

export async function members_MembershipPriceUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { balance: newMembershipPrice } = new Members.MembershipPriceUpdatedEvent(event_).data
  const membershipSystem = await getMembershipSystem(db)
  membershipSystem.membershipPrice = newMembershipPrice

  await db.save<MembershipSystem>(membershipSystem)
}

export async function members_ReferralCutUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { balance: newReferralCut } = new Members.ReferralCutUpdatedEvent(event_).data
  const membershipSystem = await getMembershipSystem(db)
  membershipSystem.referralCut = newReferralCut

  await db.save<MembershipSystem>(membershipSystem)
}

export async function members_InitialInvitationBalanceUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const { balance: newInvitedInitialBalance } = new Members.InitialInvitationBalanceUpdatedEvent(event_).data
  const membershipSystem = await getMembershipSystem(db)
  membershipSystem.invitedInitialBalance = newInvitedInitialBalance

  await db.save<MembershipSystem>(membershipSystem)
}
