/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { Membership } from 'query-node/dist/src/modules/membership/membership.model'
import { Members } from './generated/types'
import BN from 'bn.js'
import { Bytes } from '@polkadot/types'
import { EventType, MembershipEntryMethod } from 'query-node/dist/src/modules/enums/enums'
import { MembershipSystem } from 'query-node/dist/src/modules/membership-system/membership-system.model'
import { MemberMetadata } from 'query-node/dist/src/modules/member-metadata/member-metadata.model'
import { MembershipBoughtEvent } from 'query-node/dist/src/modules/membership-bought-event/membership-bought-event.model'
import { MemberProfileUpdatedEvent } from 'query-node/dist/src/modules/member-profile-updated-event/member-profile-updated-event.model'
import { MemberAccountsUpdatedEvent } from 'query-node/dist/src/modules/member-accounts-updated-event/member-accounts-updated-event.model'
import { MemberInvitedEvent } from 'query-node/dist/src/modules/member-invited-event/member-invited-event.model'
import { MemberId, BuyMembershipParameters, InviteMembershipParameters } from '@joystream/types/augment/all'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { Event } from 'query-node/dist/src/modules/event/event.model'
import { MemberVerificationStatusUpdatedEvent } from 'query-node/dist/src/modules/member-verification-status-updated-event/member-verification-status-updated-event.model'
import { createEvent } from './common'
import { InvitesTransferredEvent } from 'query-node/dist/src/modules/invites-transferred-event/invites-transferred-event.model'
import { StakingAccountConfirmedEvent } from 'query-node/dist/src/modules/staking-account-confirmed-event/staking-account-confirmed-event.model'
import { StakingAccountRemovedEvent } from 'query-node/dist/src/modules/staking-account-removed-event/staking-account-removed-event.model'
import { InitialInvitationCountUpdatedEvent } from 'query-node/dist/src/modules/initial-invitation-count-updated-event/initial-invitation-count-updated-event.model'
import { MembershipPriceUpdatedEvent } from 'query-node/dist/src/modules/membership-price-updated-event/membership-price-updated-event.model'
import { ReferralCutUpdatedEvent } from 'query-node/dist/src/modules/referral-cut-updated-event/referral-cut-updated-event.model'
import { InitialInvitationBalanceUpdatedEvent } from 'query-node/dist/src/modules/initial-invitation-balance-updated-event/initial-invitation-balance-updated-event.model'
import { StakingAccountAddedEvent } from 'query-node/dist/src/modules/staking-account-added-event/staking-account-added-event.model'
import { LeaderInvitationQuotaUpdatedEvent } from 'query-node/dist/src/modules/leader-invitation-quota-updated-event/leader-invitation-quota-updated-event.model'

async function getMemberById(db: DatabaseManager, id: MemberId): Promise<Membership> {
  const member = await db.get(Membership, { where: { id: id.toString() }, relations: ['metadata'] })
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

function deserializeMemberMeta(metadataBytes: Bytes): MembershipMetadata | null {
  try {
    return MembershipMetadata.deserializeBinary(metadataBytes.toU8a(true))
  } catch (e) {
    console.error(`Invalid membership metadata! (${metadataBytes.toHex()})`)
    return null
  }
}

async function newMembershipFromParams(
  db: DatabaseManager,
  event_: SubstrateEvent,
  memberId: MemberId,
  entryMethod: MembershipEntryMethod,
  params: BuyMembershipParameters | InviteMembershipParameters
): Promise<Membership> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const membershipSystem = await getMembershipSystem(db)
  const { root_account: rootAccount, controller_account: controllerAccount, handle, metadata: metatadaBytes } = params
  const metadata = deserializeMemberMeta(metatadaBytes)

  const metadataEntity = new MemberMetadata({
    name: metadata?.getName(),
    about: metadata?.getAbout(),
    avatarUri: metadata?.getAvatarUri(),
  })

  const member = new Membership({
    id: memberId.toString(),
    rootAccount: rootAccount.toString(),
    controllerAccount: controllerAccount.toString(),
    handle: handle.unwrap().toString(),
    metadata: metadataEntity,
    registeredAtBlock: event_.blockNumber,
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

  await db.save<MemberMetadata>(member.metadata)
  await db.save<Membership>(member)

  return member
}

export async function members_MembershipBought(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, buyMembershipParameters } = new Members.MembershipBoughtEvent(event_).data
  const member = await newMembershipFromParams(
    db,
    event_,
    memberId,
    MembershipEntryMethod.PAID,
    buyMembershipParameters
  )
  const membershipBoughtEvent = new MembershipBoughtEvent({
    event: createEvent(event_, EventType.MembershipBought),
    newMember: member,
    controllerAccount: member.controllerAccount,
    rootAccount: member.rootAccount,
    handle: member.handle,
    metadata: new MemberMetadata({
      ...member.metadata,
      id: undefined,
    }),
    referrer: member.referredBy,
  })

  await db.save<Event>(membershipBoughtEvent.event)
  await db.save<MemberMetadata>(membershipBoughtEvent.metadata)
  await db.save<MembershipBoughtEvent>(membershipBoughtEvent)
}

export async function members_MemberProfileUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId } = new Members.MemberProfileUpdatedEvent(event_).data
  const { metadata: metadataBytesOpt, handle } = new Members.UpdateProfileCall(event_).args
  const metadata = metadataBytesOpt.isSome ? deserializeMemberMeta(metadataBytesOpt.unwrap()) : undefined
  const member = await getMemberById(db, memberId)
  if (metadata?.hasName()) {
    member.metadata.name = metadata.getName()
  }
  if (metadata?.hasAbout()) {
    member.metadata.about = metadata.getAbout()
  }
  if (metadata?.hasAvatarUri()) {
    member.metadata.avatarUri = metadata.getAvatarUri()
  }
  if (handle.isSome) {
    member.handle = bytesToString(handle.unwrap())
  }

  await db.save<MemberMetadata>(member.metadata)
  await db.save<Membership>(member)

  const memberProfileUpdatedEvent = new MemberProfileUpdatedEvent({
    event: createEvent(event_, EventType.MemberProfileUpdated),
    member: member,
    newHandle: member.handle,
    newMetadata: new MemberMetadata({
      ...member.metadata,
      id: undefined,
    }),
  })

  await db.save<Event>(memberProfileUpdatedEvent.event)
  await db.save<MemberMetadata>(memberProfileUpdatedEvent.newMetadata)
  await db.save<MemberProfileUpdatedEvent>(memberProfileUpdatedEvent)
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

  const memberAccountsUpdatedEvent = new MemberAccountsUpdatedEvent({
    event: createEvent(event_, EventType.MemberAccountsUpdated),
    member: member,
    newRootAccount: member.rootAccount,
    newControllerAccount: member.controllerAccount,
  })

  await db.save<Event>(memberAccountsUpdatedEvent.event)
  await db.save<MemberAccountsUpdatedEvent>(memberAccountsUpdatedEvent)
}

export async function members_MemberVerificationStatusUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const { memberId, bool: verificationStatus } = new Members.MemberVerificationStatusUpdatedEvent(event_).data
  const member = await getMemberById(db, memberId)
  member.isVerified = verificationStatus.valueOf()

  await db.save<Membership>(member)

  const memberVerificationStatusUpdatedEvent = new MemberVerificationStatusUpdatedEvent({
    event: createEvent(event_, EventType.MemberVerificationStatusUpdated),
    member: member,
    isVerified: member.isVerified,
  })

  await db.save<Event>(memberVerificationStatusUpdatedEvent.event)
  await db.save<MemberVerificationStatusUpdatedEvent>(memberVerificationStatusUpdatedEvent)
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

  const invitesTransferredEvent = new InvitesTransferredEvent({
    event: createEvent(event_, EventType.InvitesTransferred),
    sourceMember,
    targetMember,
    numberOfInvites: numberOfInvites.toNumber(),
  })

  await db.save<Event>(invitesTransferredEvent.event)
  await db.save<InvitesTransferredEvent>(invitesTransferredEvent)
}

export async function members_MemberInvited(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, inviteMembershipParameters } = new Members.MemberInvitedEvent(event_).data
  const invitedMember = await newMembershipFromParams(
    db,
    event_,
    memberId,
    MembershipEntryMethod.INVITED,
    inviteMembershipParameters
  )

  // Decrease invite count of inviting member
  const invitingMember = await getMemberById(db, inviteMembershipParameters.inviting_member_id)
  invitingMember.inviteCount -= 1
  await db.save<Membership>(invitingMember)

  const memberInvitedEvent = new MemberInvitedEvent({
    event: createEvent(event_, EventType.MemberInvited),
    invitingMember,
    newMember: invitedMember,
    handle: invitedMember.handle,
    rootAccount: invitedMember.rootAccount,
    controllerAccount: invitedMember.controllerAccount,
    metadata: new MemberMetadata({
      ...invitedMember.metadata,
      id: undefined,
    }),
  })

  await db.save<Event>(memberInvitedEvent.event)
  await db.save<MemberMetadata>(memberInvitedEvent.metadata)
  await db.save<MemberInvitedEvent>(memberInvitedEvent)
}

export async function members_StakingAccountAdded(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, accountId } = new Members.StakingAccountAddedEvent(event_).data

  const stakingAccountAddedEvent = new StakingAccountAddedEvent({
    event: createEvent(event_, EventType.StakingAccountAddedEvent),
    member: new Membership({ id: memberId.toString() }),
    account: accountId.toString(),
  })

  await db.save<Event>(stakingAccountAddedEvent.event)
  await db.save<StakingAccountAddedEvent>(stakingAccountAddedEvent)
}

export async function members_StakingAccountConfirmed(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, accountId } = new Members.StakingAccountConfirmedEvent(event_).data
  const member = await getMemberById(db, memberId)
  member.boundAccounts.push(accountId.toString())

  await db.save<Membership>(member)

  const stakingAccountConfirmedEvent = new StakingAccountConfirmedEvent({
    event: createEvent(event_, EventType.StakingAccountConfirmed),
    member,
    account: accountId.toString(),
  })

  await db.save<Event>(stakingAccountConfirmedEvent.event)
  await db.save<StakingAccountConfirmedEvent>(stakingAccountConfirmedEvent)
}

export async function members_StakingAccountRemoved(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { memberId, accountId } = new Members.StakingAccountRemovedEvent(event_).data
  const member = await getMemberById(db, memberId)
  member.boundAccounts.splice(
    member.boundAccounts.findIndex((a) => a === accountId.toString()),
    1
  )

  await db.save<Membership>(member)

  const stakingAccountRemovedEvent = new StakingAccountRemovedEvent({
    event: createEvent(event_, EventType.StakingAccountRemoved),
    member,
    account: accountId.toString(),
  })

  await db.save<Event>(stakingAccountRemovedEvent.event)
  await db.save<StakingAccountRemovedEvent>(stakingAccountRemovedEvent)
}

export async function members_InitialInvitationCountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const { u32: newDefaultInviteCount } = new Members.InitialInvitationCountUpdatedEvent(event_).data
  const membershipSystem = await getMembershipSystem(db)
  membershipSystem.defaultInviteCount = newDefaultInviteCount.toNumber()

  await db.save<MembershipSystem>(membershipSystem)

  const initialInvitationCountUpdatedEvent = new InitialInvitationCountUpdatedEvent({
    event: createEvent(event_, EventType.InitialInvitationCountUpdated),
    newInitialInvitationCount: newDefaultInviteCount.toNumber(),
  })

  await db.save<Event>(initialInvitationCountUpdatedEvent.event)
  await db.save<InitialInvitationCountUpdatedEvent>(initialInvitationCountUpdatedEvent)
}

export async function members_MembershipPriceUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { balance: newMembershipPrice } = new Members.MembershipPriceUpdatedEvent(event_).data
  const membershipSystem = await getMembershipSystem(db)
  membershipSystem.membershipPrice = newMembershipPrice

  await db.save<MembershipSystem>(membershipSystem)

  const membershipPriceUpdatedEvent = new MembershipPriceUpdatedEvent({
    event: createEvent(event_, EventType.MembershipPriceUpdated),
    newPrice: newMembershipPrice,
  })

  await db.save<Event>(membershipPriceUpdatedEvent.event)
  await db.save<MembershipPriceUpdatedEvent>(membershipPriceUpdatedEvent)
}

export async function members_ReferralCutUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { balance: newReferralCut } = new Members.ReferralCutUpdatedEvent(event_).data
  const membershipSystem = await getMembershipSystem(db)
  membershipSystem.referralCut = newReferralCut

  await db.save<MembershipSystem>(membershipSystem)

  const referralCutUpdatedEvent = new ReferralCutUpdatedEvent({
    event: createEvent(event_, EventType.ReferralCutUpdated),
    newValue: newReferralCut,
  })

  await db.save<Event>(referralCutUpdatedEvent.event)
  await db.save<ReferralCutUpdatedEvent>(referralCutUpdatedEvent)
}

export async function members_InitialInvitationBalanceUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const { balance: newInvitedInitialBalance } = new Members.InitialInvitationBalanceUpdatedEvent(event_).data
  const membershipSystem = await getMembershipSystem(db)
  membershipSystem.invitedInitialBalance = newInvitedInitialBalance

  await db.save<MembershipSystem>(membershipSystem)

  const initialInvitationBalanceUpdatedEvent = new InitialInvitationBalanceUpdatedEvent({
    event: createEvent(event_, EventType.InitialInvitationBalanceUpdated),
    newInitialBalance: newInvitedInitialBalance,
  })

  await db.save<Event>(initialInvitationBalanceUpdatedEvent.event)
  await db.save<InitialInvitationBalanceUpdatedEvent>(initialInvitationBalanceUpdatedEvent)
}

export async function members_LeaderInvitationQuotaUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const { u32: newQuota } = new Members.LeaderInvitationQuotaUpdatedEvent(event_).data

  const leaderInvitationQuotaUpdatedEvent = new LeaderInvitationQuotaUpdatedEvent({
    event: createEvent(event_, EventType.LeaderInvitationQuotaUpdated),
    newInvitationQuota: newQuota.toNumber(),
  })

  // TODO: Update MembershipSystem?

  await db.save<Event>(leaderInvitationQuotaUpdatedEvent.event)
  await db.save<LeaderInvitationQuotaUpdatedEvent>(leaderInvitationQuotaUpdatedEvent)
}
