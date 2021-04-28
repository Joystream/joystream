/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { Members } from './generated/types'
import BN from 'bn.js'
import { MemberId, BuyMembershipParameters, InviteMembershipParameters } from '@joystream/types/augment/all'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { bytesToString, createEvent, deserializeMetadata, getOrCreateBlock } from './common'
import {
  Membership,
  EventType,
  MembershipEntryMethod,
  MembershipSystemSnapshot,
  MemberMetadata,
  MembershipBoughtEvent,
  MemberProfileUpdatedEvent,
  MemberAccountsUpdatedEvent,
  MemberInvitedEvent,
  MemberVerificationStatusUpdatedEvent,
  InvitesTransferredEvent,
  StakingAccountConfirmedEvent,
  StakingAccountRemovedEvent,
  InitialInvitationCountUpdatedEvent,
  MembershipPriceUpdatedEvent,
  ReferralCutUpdatedEvent,
  InitialInvitationBalanceUpdatedEvent,
  StakingAccountAddedEvent,
  LeaderInvitationQuotaUpdatedEvent,
} from 'query-node/dist/model'

async function getMemberById(db: DatabaseManager, id: MemberId): Promise<Membership> {
  const member = await db.get(Membership, { where: { id: id.toString() }, relations: ['metadata'] })
  if (!member) {
    throw new Error(`Member(${id}) not found`)
  }
  return member
}

async function getLatestMembershipSystemSnapshot(db: DatabaseManager): Promise<MembershipSystemSnapshot> {
  const membershipSystem = await db.get(MembershipSystemSnapshot, {
    order: { snapshotBlock: 'DESC' },
    relations: ['snapshotBlock'],
  })
  if (!membershipSystem) {
    throw new Error(`Membership system snapshot not found! Forgot to run "yarn workspace query-node-root db:init"?`)
  }
  return membershipSystem
}

async function getOrCreateMembershipSnapshot(db: DatabaseManager, event_: SubstrateEvent) {
  const latestSnapshot = await getLatestMembershipSystemSnapshot(db)
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  return latestSnapshot.snapshotBlock.number === event_.blockNumber
    ? latestSnapshot
    : new MembershipSystemSnapshot({
        ...latestSnapshot,
        createdAt: eventTime,
        updatedAt: eventTime,
        id: undefined,
        snapshotBlock: await getOrCreateBlock(db, event_),
        snapshotTime: new Date(new BN(event_.blockTimestamp).toNumber()),
      })
}

async function newMembershipFromParams(
  db: DatabaseManager,
  event_: SubstrateEvent,
  memberId: MemberId,
  entryMethod: MembershipEntryMethod,
  params: BuyMembershipParameters | InviteMembershipParameters
): Promise<Membership> {
  const { defaultInviteCount } = await getLatestMembershipSystemSnapshot(db)
  const { root_account: rootAccount, controller_account: controllerAccount, handle, metadata: metatadaBytes } = params
  const metadata = deserializeMetadata(MembershipMetadata, metatadaBytes)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const metadataEntity = new MemberMetadata({
    createdAt: eventTime,
    updatedAt: eventTime,
    name: metadata?.name || undefined,
    about: metadata?.about || undefined,
    // TODO: avatar
  })

  const member = new Membership({
    createdAt: eventTime,
    updatedAt: eventTime,
    id: memberId.toString(),
    rootAccount: rootAccount.toString(),
    controllerAccount: controllerAccount.toString(),
    handle: handle.unwrap().toString(),
    metadata: metadataEntity,
    registeredAtBlock: await getOrCreateBlock(db, event_),
    registeredAtTime: new Date(event_.blockTimestamp.toNumber()),
    entry: entryMethod,
    referredBy:
      entryMethod === MembershipEntryMethod.PAID && (params as BuyMembershipParameters).referrer_id.isSome
        ? new Membership({ id: (params as BuyMembershipParameters).referrer_id.unwrap().toString() })
        : undefined,
    isVerified: false,
    inviteCount: defaultInviteCount,
    boundAccounts: [],
    invitees: [],
    referredMembers: [],
    invitedBy:
      entryMethod === MembershipEntryMethod.INVITED
        ? new Membership({ id: (params as InviteMembershipParameters).inviting_member_id.toString() })
        : undefined,
    isFoundingMember: false,
  })

  await db.save<MemberMetadata>(member.metadata)
  await db.save<Membership>(member)

  return member
}

export async function members_MembershipBought(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId, buyMembershipParameters } = new Members.MembershipBoughtEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const member = await newMembershipFromParams(
    db,
    event_,
    memberId,
    MembershipEntryMethod.PAID,
    buyMembershipParameters
  )

  const membershipBoughtEvent = new MembershipBoughtEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.MembershipBought),
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

  await db.save<MemberMetadata>(membershipBoughtEvent.metadata)
  await db.save<MembershipBoughtEvent>(membershipBoughtEvent)
}

export async function members_MemberProfileUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId } = new Members.MemberProfileUpdatedEvent(event_).data
  const { metadata: metadataBytesOpt, handle } = new Members.UpdateProfileCall(event_).args
  const metadata = metadataBytesOpt.isSome
    ? deserializeMetadata(MembershipMetadata, metadataBytesOpt.unwrap())
    : undefined
  const member = await getMemberById(db, memberId)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  if (typeof metadata?.name === 'string') {
    member.metadata.name = metadata.name || undefined
    member.metadata.updatedAt = eventTime
  }
  if (typeof metadata?.about === 'string') {
    member.metadata.about = metadata.about || undefined
    member.metadata.updatedAt = eventTime
  }
  // TODO: avatar
  if (handle.isSome) {
    member.handle = bytesToString(handle.unwrap())
    member.updatedAt = eventTime
  }

  await db.save<MemberMetadata>(member.metadata)
  await db.save<Membership>(member)

  const memberProfileUpdatedEvent = new MemberProfileUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.MemberProfileUpdated),
    member: member,
    newHandle: member.handle,
    newMetadata: new MemberMetadata({
      ...member.metadata,
      id: undefined,
    }),
  })

  await db.save<MemberMetadata>(memberProfileUpdatedEvent.newMetadata)
  await db.save<MemberProfileUpdatedEvent>(memberProfileUpdatedEvent)
}

export async function members_MemberAccountsUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId } = new Members.MemberAccountsUpdatedEvent(event_).data
  const { newRootAccount, newControllerAccount } = new Members.UpdateAccountsCall(event_).args
  const member = await getMemberById(db, memberId)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  if (newControllerAccount.isSome) {
    member.controllerAccount = newControllerAccount.unwrap().toString()
  }
  if (newRootAccount.isSome) {
    member.rootAccount = newRootAccount.unwrap().toString()
  }
  member.updatedAt = eventTime

  await db.save<Membership>(member)

  const memberAccountsUpdatedEvent = new MemberAccountsUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.MemberAccountsUpdated),
    member: member,
    newRootAccount: member.rootAccount,
    newControllerAccount: member.controllerAccount,
  })

  await db.save<MemberAccountsUpdatedEvent>(memberAccountsUpdatedEvent)
}

export async function members_MemberVerificationStatusUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId, bool: verificationStatus } = new Members.MemberVerificationStatusUpdatedEvent(event_).data
  const member = await getMemberById(db, memberId)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  member.isVerified = verificationStatus.valueOf()
  member.updatedAt = eventTime

  await db.save<Membership>(member)

  const memberVerificationStatusUpdatedEvent = new MemberVerificationStatusUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.MemberVerificationStatusUpdated),
    member: member,
    isVerified: member.isVerified,
  })

  await db.save<MemberVerificationStatusUpdatedEvent>(memberVerificationStatusUpdatedEvent)
}

export async function members_InvitesTransferred(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const {
    memberIds: { 0: sourceMemberId, 1: targetMemberId },
    u32: numberOfInvites,
  } = new Members.InvitesTransferredEvent(event_).data
  const sourceMember = await getMemberById(db, sourceMemberId)
  const targetMember = await getMemberById(db, targetMemberId)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  sourceMember.inviteCount -= numberOfInvites.toNumber()
  sourceMember.updatedAt = eventTime
  targetMember.inviteCount += numberOfInvites.toNumber()
  targetMember.updatedAt = eventTime

  await db.save<Membership>(sourceMember)
  await db.save<Membership>(targetMember)

  const invitesTransferredEvent = new InvitesTransferredEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.InvitesTransferred),
    sourceMember,
    targetMember,
    numberOfInvites: numberOfInvites.toNumber(),
  })

  await db.save<InvitesTransferredEvent>(invitesTransferredEvent)
}

export async function members_MemberInvited(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId, inviteMembershipParameters } = new Members.MemberInvitedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
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
  invitedMember.updatedAt = eventTime
  await db.save<Membership>(invitingMember)

  const memberInvitedEvent = new MemberInvitedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.MemberInvited),
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

  await db.save<MemberMetadata>(memberInvitedEvent.metadata)
  await db.save<MemberInvitedEvent>(memberInvitedEvent)
}

export async function members_StakingAccountAdded(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId, accountId } = new Members.StakingAccountAddedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const stakingAccountAddedEvent = new StakingAccountAddedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.StakingAccountAddedEvent),
    member: new Membership({ id: memberId.toString() }),
    account: accountId.toString(),
  })

  await db.save<StakingAccountAddedEvent>(stakingAccountAddedEvent)
}

export async function members_StakingAccountConfirmed(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId, accountId } = new Members.StakingAccountConfirmedEvent(event_).data
  const member = await getMemberById(db, memberId)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  member.boundAccounts.push(accountId.toString())
  member.updatedAt = eventTime

  await db.save<Membership>(member)

  const stakingAccountConfirmedEvent = new StakingAccountConfirmedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.StakingAccountConfirmed),
    member,
    account: accountId.toString(),
  })

  await db.save<StakingAccountConfirmedEvent>(stakingAccountConfirmedEvent)
}

export async function members_StakingAccountRemoved(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { memberId, accountId } = new Members.StakingAccountRemovedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())
  const member = await getMemberById(db, memberId)

  member.boundAccounts.splice(
    member.boundAccounts.findIndex((a) => a === accountId.toString()),
    1
  )
  member.updatedAt = eventTime

  await db.save<Membership>(member)

  const stakingAccountRemovedEvent = new StakingAccountRemovedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.StakingAccountRemoved),
    member,
    account: accountId.toString(),
  })

  await db.save<StakingAccountRemovedEvent>(stakingAccountRemovedEvent)
}

export async function members_InitialInvitationCountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { u32: newDefaultInviteCount } = new Members.InitialInvitationCountUpdatedEvent(event_).data
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  membershipSystemSnapshot.defaultInviteCount = newDefaultInviteCount.toNumber()

  await db.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const initialInvitationCountUpdatedEvent = new InitialInvitationCountUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.InitialInvitationCountUpdated),
    newInitialInvitationCount: newDefaultInviteCount.toNumber(),
  })

  await db.save<InitialInvitationCountUpdatedEvent>(initialInvitationCountUpdatedEvent)
}

export async function members_MembershipPriceUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { balance: newMembershipPrice } = new Members.MembershipPriceUpdatedEvent(event_).data
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  membershipSystemSnapshot.membershipPrice = newMembershipPrice

  await db.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const membershipPriceUpdatedEvent = new MembershipPriceUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.MembershipPriceUpdated),
    newPrice: newMembershipPrice,
  })

  await db.save<MembershipPriceUpdatedEvent>(membershipPriceUpdatedEvent)
}

export async function members_ReferralCutUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { u8: newReferralCut } = new Members.ReferralCutUpdatedEvent(event_).data
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  membershipSystemSnapshot.referralCut = newReferralCut.toNumber()

  await db.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const referralCutUpdatedEvent = new ReferralCutUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.ReferralCutUpdated),
    newValue: newReferralCut.toNumber(),
  })

  await db.save<ReferralCutUpdatedEvent>(referralCutUpdatedEvent)
}

export async function members_InitialInvitationBalanceUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { balance: newInvitedInitialBalance } = new Members.InitialInvitationBalanceUpdatedEvent(event_).data
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(db, event_)
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  membershipSystemSnapshot.invitedInitialBalance = newInvitedInitialBalance

  await db.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const initialInvitationBalanceUpdatedEvent = new InitialInvitationBalanceUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.InitialInvitationBalanceUpdated),
    newInitialBalance: newInvitedInitialBalance,
  })

  await db.save<InitialInvitationBalanceUpdatedEvent>(initialInvitationBalanceUpdatedEvent)
}

export async function members_LeaderInvitationQuotaUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  event_.blockTimestamp = new BN(event_.blockTimestamp) // FIXME: Temporary fix for wrong blockTimestamp type
  const { u32: newQuota } = new Members.LeaderInvitationQuotaUpdatedEvent(event_).data
  const eventTime = new Date(event_.blockTimestamp.toNumber())

  const leaderInvitationQuotaUpdatedEvent = new LeaderInvitationQuotaUpdatedEvent({
    createdAt: eventTime,
    updatedAt: eventTime,
    event: await createEvent(db, event_, EventType.LeaderInvitationQuotaUpdated),
    newInvitationQuota: newQuota.toNumber(),
  })

  await db.save<LeaderInvitationQuotaUpdatedEvent>(leaderInvitationQuotaUpdatedEvent)
}
