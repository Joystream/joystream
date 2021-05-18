/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent, DatabaseManager } from '@dzlzv/hydra-common'
import { Members } from './generated/types'
import { MemberId, BuyMembershipParameters, InviteMembershipParameters } from '@joystream/types/augment/all'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { bytesToString, deserializeMetadata, genericEventFields } from './common'
import {
  Membership,
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
  MembershipEntryPaid,
  MembershipEntryInvited,
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
  })
  if (!membershipSystem) {
    throw new Error(`Membership system snapshot not found! Forgot to run "yarn workspace query-node-root db:init"?`)
  }
  return membershipSystem
}

async function getOrCreateMembershipSnapshot(db: DatabaseManager, event_: SubstrateEvent) {
  const latestSnapshot = await getLatestMembershipSystemSnapshot(db)
  const eventTime = new Date(event_.blockTimestamp)
  return latestSnapshot.snapshotBlock === event_.blockNumber
    ? latestSnapshot
    : new MembershipSystemSnapshot({
        ...latestSnapshot,
        createdAt: eventTime,
        updatedAt: eventTime,
        id: undefined,
        snapshotBlock: event_.blockNumber,
      })
}

async function createNewMemberFromParams(
  db: DatabaseManager,
  event_: SubstrateEvent,
  memberId: MemberId,
  entryMethod: typeof MembershipEntryMethod,
  params: BuyMembershipParameters | InviteMembershipParameters
): Promise<Membership> {
  const { defaultInviteCount } = await getLatestMembershipSystemSnapshot(db)
  const { root_account: rootAccount, controller_account: controllerAccount, handle, metadata: metatadaBytes } = params
  const metadata = deserializeMetadata(MembershipMetadata, metatadaBytes)
  const eventTime = new Date(event_.blockTimestamp)

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
    entry: entryMethod,
    referredBy:
      entryMethod.isTypeOf === 'MembershipEntryPaid' && (params as BuyMembershipParameters).referrer_id.isSome
        ? new Membership({ id: (params as BuyMembershipParameters).referrer_id.unwrap().toString() })
        : undefined,
    isVerified: false,
    inviteCount: defaultInviteCount,
    boundAccounts: [],
    invitees: [],
    referredMembers: [],
    invitedBy:
      entryMethod.isTypeOf === 'MembershipEntryInvited'
        ? new Membership({ id: (params as InviteMembershipParameters).inviting_member_id.toString() })
        : undefined,
    isFoundingMember: false,
  })

  await db.save<MemberMetadata>(member.metadata)
  await db.save<Membership>(member)

  return member
}

export async function members_MembershipBought(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [memberId, buyMembershipParameters] = new Members.MembershipBoughtEvent(event_).params

  const memberEntry = new MembershipEntryPaid()
  const member = await createNewMemberFromParams(db, event_, memberId, memberEntry, buyMembershipParameters)

  const membershipBoughtEvent = new MembershipBoughtEvent({
    ...genericEventFields(event_),
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

  // Update the other side of event<->membership relation
  memberEntry.membershipBoughtEventId = membershipBoughtEvent.id
  await db.save<Membership>(member)
}

export async function members_MemberProfileUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [memberId] = new Members.MemberProfileUpdatedEvent(event_).params
  const { metadata: metadataBytesOpt, handle } = new Members.UpdateProfileCall(event_).args
  const metadata = metadataBytesOpt.isSome
    ? deserializeMetadata(MembershipMetadata, metadataBytesOpt.unwrap())
    : undefined
  const member = await getMemberById(db, memberId)
  const eventTime = new Date(event_.blockTimestamp)

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
    ...genericEventFields(event_),
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
  const [memberId] = new Members.MemberAccountsUpdatedEvent(event_).params
  const { newRootAccount, newControllerAccount } = new Members.UpdateAccountsCall(event_).args
  const member = await getMemberById(db, memberId)
  const eventTime = new Date(event_.blockTimestamp)

  if (newControllerAccount.isSome) {
    member.controllerAccount = newControllerAccount.unwrap().toString()
  }
  if (newRootAccount.isSome) {
    member.rootAccount = newRootAccount.unwrap().toString()
  }
  member.updatedAt = eventTime

  await db.save<Membership>(member)

  const memberAccountsUpdatedEvent = new MemberAccountsUpdatedEvent({
    ...genericEventFields(event_),
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
  const [memberId, verificationStatus] = new Members.MemberVerificationStatusUpdatedEvent(event_).params
  const member = await getMemberById(db, memberId)
  const eventTime = new Date(event_.blockTimestamp)

  member.isVerified = verificationStatus.valueOf()
  member.updatedAt = eventTime

  await db.save<Membership>(member)

  const memberVerificationStatusUpdatedEvent = new MemberVerificationStatusUpdatedEvent({
    ...genericEventFields(event_),
    member: member,
    isVerified: member.isVerified,
  })

  await db.save<MemberVerificationStatusUpdatedEvent>(memberVerificationStatusUpdatedEvent)
}

export async function members_InvitesTransferred(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [sourceMemberId, targetMemberId, numberOfInvites] = new Members.InvitesTransferredEvent(event_).params
  const sourceMember = await getMemberById(db, sourceMemberId)
  const targetMember = await getMemberById(db, targetMemberId)
  const eventTime = new Date(event_.blockTimestamp)

  sourceMember.inviteCount -= numberOfInvites.toNumber()
  sourceMember.updatedAt = eventTime
  targetMember.inviteCount += numberOfInvites.toNumber()
  targetMember.updatedAt = eventTime

  await db.save<Membership>(sourceMember)
  await db.save<Membership>(targetMember)

  const invitesTransferredEvent = new InvitesTransferredEvent({
    ...genericEventFields(event_),
    sourceMember,
    targetMember,
    numberOfInvites: numberOfInvites.toNumber(),
  })

  await db.save<InvitesTransferredEvent>(invitesTransferredEvent)
}

export async function members_MemberInvited(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [memberId, inviteMembershipParameters] = new Members.MemberInvitedEvent(event_).params
  const eventTime = new Date(event_.blockTimestamp)
  const entryMethod = new MembershipEntryInvited()
  const invitedMember = await createNewMemberFromParams(db, event_, memberId, entryMethod, inviteMembershipParameters)

  // Decrease invite count of inviting member
  const invitingMember = await getMemberById(db, inviteMembershipParameters.inviting_member_id)
  invitingMember.inviteCount -= 1
  invitingMember.updatedAt = eventTime
  await db.save<Membership>(invitingMember)

  const memberInvitedEvent = new MemberInvitedEvent({
    ...genericEventFields(event_),
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
  // Update the other side of event<->member relationship
  entryMethod.memberInvitedEventId = memberInvitedEvent.id
  await db.save<Membership>(invitedMember)
}

export async function members_StakingAccountAdded(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [accountId, memberId] = new Members.StakingAccountAddedEvent(event_).params

  const stakingAccountAddedEvent = new StakingAccountAddedEvent({
    ...genericEventFields(event_),
    member: new Membership({ id: memberId.toString() }),
    account: accountId.toString(),
  })

  await db.save<StakingAccountAddedEvent>(stakingAccountAddedEvent)
}

export async function members_StakingAccountConfirmed(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [accountId, memberId] = new Members.StakingAccountConfirmedEvent(event_).params
  const member = await getMemberById(db, memberId)
  const eventTime = new Date(event_.blockTimestamp)

  member.boundAccounts.push(accountId.toString())
  member.updatedAt = eventTime

  await db.save<Membership>(member)

  const stakingAccountConfirmedEvent = new StakingAccountConfirmedEvent({
    ...genericEventFields(event_),
    member,
    account: accountId.toString(),
  })

  await db.save<StakingAccountConfirmedEvent>(stakingAccountConfirmedEvent)
}

export async function members_StakingAccountRemoved(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [accountId, memberId] = new Members.StakingAccountRemovedEvent(event_).params
  const eventTime = new Date(event_.blockTimestamp)
  const member = await getMemberById(db, memberId)

  member.boundAccounts.splice(
    member.boundAccounts.findIndex((a) => a === accountId.toString()),
    1
  )
  member.updatedAt = eventTime

  await db.save<Membership>(member)

  const stakingAccountRemovedEvent = new StakingAccountRemovedEvent({
    ...genericEventFields(event_),
    member,
    account: accountId.toString(),
  })

  await db.save<StakingAccountRemovedEvent>(stakingAccountRemovedEvent)
}

export async function members_InitialInvitationCountUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const [newDefaultInviteCount] = new Members.InitialInvitationCountUpdatedEvent(event_).params
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(db, event_)

  membershipSystemSnapshot.defaultInviteCount = newDefaultInviteCount.toNumber()

  await db.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const initialInvitationCountUpdatedEvent = new InitialInvitationCountUpdatedEvent({
    ...genericEventFields(event_),
    newInitialInvitationCount: newDefaultInviteCount.toNumber(),
  })

  await db.save<InitialInvitationCountUpdatedEvent>(initialInvitationCountUpdatedEvent)
}

export async function members_MembershipPriceUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [newMembershipPrice] = new Members.MembershipPriceUpdatedEvent(event_).params
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(db, event_)

  membershipSystemSnapshot.membershipPrice = newMembershipPrice

  await db.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const membershipPriceUpdatedEvent = new MembershipPriceUpdatedEvent({
    ...genericEventFields(event_),
    newPrice: newMembershipPrice,
  })

  await db.save<MembershipPriceUpdatedEvent>(membershipPriceUpdatedEvent)
}

export async function members_ReferralCutUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [newReferralCut] = new Members.ReferralCutUpdatedEvent(event_).params
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(db, event_)

  membershipSystemSnapshot.referralCut = newReferralCut.toNumber()

  await db.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const referralCutUpdatedEvent = new ReferralCutUpdatedEvent({
    ...genericEventFields(event_),
    newValue: newReferralCut.toNumber(),
  })

  await db.save<ReferralCutUpdatedEvent>(referralCutUpdatedEvent)
}

export async function members_InitialInvitationBalanceUpdated(
  db: DatabaseManager,
  event_: SubstrateEvent
): Promise<void> {
  const [newInvitedInitialBalance] = new Members.InitialInvitationBalanceUpdatedEvent(event_).params
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(db, event_)

  membershipSystemSnapshot.invitedInitialBalance = newInvitedInitialBalance

  await db.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const initialInvitationBalanceUpdatedEvent = new InitialInvitationBalanceUpdatedEvent({
    ...genericEventFields(event_),
    newInitialBalance: newInvitedInitialBalance,
  })

  await db.save<InitialInvitationBalanceUpdatedEvent>(initialInvitationBalanceUpdatedEvent)
}

export async function members_LeaderInvitationQuotaUpdated(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  const [newQuota] = new Members.LeaderInvitationQuotaUpdatedEvent(event_).params

  const leaderInvitationQuotaUpdatedEvent = new LeaderInvitationQuotaUpdatedEvent({
    ...genericEventFields(event_),
    newInvitationQuota: newQuota.toNumber(),
  })

  await db.save<LeaderInvitationQuotaUpdatedEvent>(leaderInvitationQuotaUpdatedEvent)
}
