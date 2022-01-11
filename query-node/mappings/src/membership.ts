/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext, DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { Members } from '../generated/types'
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
  AvatarUri,
} from 'query-node/dist/model'

async function getMemberById(store: DatabaseManager, id: MemberId): Promise<Membership> {
  const member = await store.get(Membership, { where: { id: id.toString() }, relations: ['metadata'] })
  if (!member) {
    throw new Error(`Member(${id}) not found`)
  }
  return member
}

async function getLatestMembershipSystemSnapshot(store: DatabaseManager): Promise<MembershipSystemSnapshot> {
  const membershipSystem = await store.get(MembershipSystemSnapshot, {
    order: { snapshotBlock: 'DESC' },
  })
  if (!membershipSystem) {
    throw new Error(`Membership system snapshot not found! Forgot to run "yarn workspace query-node-root store:init"?`)
  }
  return membershipSystem
}

async function getOrCreateMembershipSnapshot({ store, event }: EventContext & StoreContext) {
  const latestSnapshot = await getLatestMembershipSystemSnapshot(store)
  const eventTime = new Date(event.blockTimestamp)
  return latestSnapshot.snapshotBlock === event.blockNumber
    ? latestSnapshot
    : new MembershipSystemSnapshot({
        ...latestSnapshot,
        createdAt: eventTime,
        updatedAt: eventTime,
        id: undefined,
        snapshotBlock: event.blockNumber,
      })
}

async function createNewMemberFromParams(
  store: DatabaseManager,
  event: SubstrateEvent,
  memberId: MemberId,
  entryMethod: typeof MembershipEntryMethod,
  params: BuyMembershipParameters | InviteMembershipParameters
): Promise<Membership> {
  const { defaultInviteCount } = await getLatestMembershipSystemSnapshot(store)
  const { root_account: rootAccount, controller_account: controllerAccount, handle, metadata: metadataBytes } = params
  const metadata = deserializeMetadata(MembershipMetadata, metadataBytes)
  const eventTime = new Date(event.blockTimestamp)

  const avatar = new AvatarUri()
  avatar.avatarUri = metadata?.avatarUri ?? ''

  const metadataEntity = new MemberMetadata({
    createdAt: eventTime,
    updatedAt: eventTime,
    name: metadata?.name || undefined,
    about: metadata?.about || undefined,
    avatar,
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
    isCouncilMember: false,

    councilCandidacies: [],
    councilMembers: [],
  })

  await store.save<MemberMetadata>(member.metadata)
  await store.save<Membership>(member)

  return member
}

export async function members_MembershipBought({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, buyMembershipParameters] = new Members.MembershipBoughtEvent(event).params

  const memberEntry = new MembershipEntryPaid()
  const member = await createNewMemberFromParams(store, event, memberId, memberEntry, buyMembershipParameters)

  const membershipBoughtEvent = new MembershipBoughtEvent({
    ...genericEventFields(event),
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

  await store.save<MemberMetadata>(membershipBoughtEvent.metadata)
  await store.save<MembershipBoughtEvent>(membershipBoughtEvent)

  // Update the other side of event<->membership relation
  memberEntry.membershipBoughtEventId = membershipBoughtEvent.id
  await store.save<Membership>(member)
}

export async function members_MemberProfileUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, newHandle, newMetadata] = new Members.MemberProfileUpdatedEvent(event).params
  const metadata = newMetadata.isSome ? deserializeMetadata(MembershipMetadata, newMetadata.unwrap()) : undefined
  const member = await getMemberById(store, memberId)
  const eventTime = new Date(event.blockTimestamp)

  // FIXME: https://github.com/Joystream/hydra/issues/435
  if (typeof metadata?.name === 'string') {
    member.metadata.name = (metadata.name || null) as string | undefined
    member.metadata.updatedAt = eventTime
  }
  if (typeof metadata?.about === 'string') {
    member.metadata.about = (metadata.about || null) as string | undefined
    member.metadata.updatedAt = eventTime
  }

  if (typeof metadata?.avatarUri === 'string') {
    member.metadata.avatar = new AvatarUri()
    member.metadata.avatar.avatarUri = metadata.avatarUri
  }

  if (newHandle.isSome) {
    member.handle = bytesToString(newHandle.unwrap())
    member.updatedAt = eventTime
  }

  await store.save<MemberMetadata>(member.metadata)
  await store.save<Membership>(member)

  const memberProfileUpdatedEvent = new MemberProfileUpdatedEvent({
    ...genericEventFields(event),
    member: member,
    newHandle: member.handle,
    newMetadata: new MemberMetadata({
      ...member.metadata,
      id: undefined,
    }),
  })

  await store.save<MemberMetadata>(memberProfileUpdatedEvent.newMetadata)
  await store.save<MemberProfileUpdatedEvent>(memberProfileUpdatedEvent)
}

export async function members_MemberAccountsUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, newRootAccount, newControllerAccount] = new Members.MemberAccountsUpdatedEvent(event).params
  const member = await getMemberById(store, memberId)
  const eventTime = new Date(event.blockTimestamp)

  if (newControllerAccount.isSome) {
    member.controllerAccount = newControllerAccount.unwrap().toString()
  }
  if (newRootAccount.isSome) {
    member.rootAccount = newRootAccount.unwrap().toString()
  }
  member.updatedAt = eventTime

  await store.save<Membership>(member)

  const memberAccountsUpdatedEvent = new MemberAccountsUpdatedEvent({
    ...genericEventFields(event),
    member: member,
    newRootAccount: member.rootAccount,
    newControllerAccount: member.controllerAccount,
  })

  await store.save<MemberAccountsUpdatedEvent>(memberAccountsUpdatedEvent)
}

export async function members_MemberVerificationStatusUpdated(
  store: DatabaseManager,
  event: SubstrateEvent
): Promise<void> {
  const [memberId, verificationStatus] = new Members.MemberVerificationStatusUpdatedEvent(event).params
  const member = await getMemberById(store, memberId)
  const eventTime = new Date(event.blockTimestamp)

  member.isVerified = verificationStatus.valueOf()
  member.updatedAt = eventTime

  await store.save<Membership>(member)

  const memberVerificationStatusUpdatedEvent = new MemberVerificationStatusUpdatedEvent({
    ...genericEventFields(event),
    member: member,
    isVerified: member.isVerified,
  })

  await store.save<MemberVerificationStatusUpdatedEvent>(memberVerificationStatusUpdatedEvent)
}

export async function members_InvitesTransferred({ store, event }: EventContext & StoreContext): Promise<void> {
  const [sourceMemberId, targetMemberId, numberOfInvites] = new Members.InvitesTransferredEvent(event).params
  const sourceMember = await getMemberById(store, sourceMemberId)
  const targetMember = await getMemberById(store, targetMemberId)
  const eventTime = new Date(event.blockTimestamp)

  sourceMember.inviteCount -= numberOfInvites.toNumber()
  sourceMember.updatedAt = eventTime
  targetMember.inviteCount += numberOfInvites.toNumber()
  targetMember.updatedAt = eventTime

  await store.save<Membership>(sourceMember)
  await store.save<Membership>(targetMember)

  const invitesTransferredEvent = new InvitesTransferredEvent({
    ...genericEventFields(event),
    sourceMember,
    targetMember,
    numberOfInvites: numberOfInvites.toNumber(),
  })

  await store.save<InvitesTransferredEvent>(invitesTransferredEvent)
}

export async function members_MemberInvited({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, inviteMembershipParameters] = new Members.MemberInvitedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const entryMethod = new MembershipEntryInvited()
  const invitedMember = await createNewMemberFromParams(store, event, memberId, entryMethod, inviteMembershipParameters)

  // Decrease invite count of inviting member
  const invitingMember = await getMemberById(store, inviteMembershipParameters.inviting_member_id)
  invitingMember.inviteCount -= 1
  invitingMember.updatedAt = eventTime
  await store.save<Membership>(invitingMember)

  const memberInvitedEvent = new MemberInvitedEvent({
    ...genericEventFields(event),
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

  await store.save<MemberMetadata>(memberInvitedEvent.metadata)
  await store.save<MemberInvitedEvent>(memberInvitedEvent)
  // Update the other side of event<->member relationship
  entryMethod.memberInvitedEventId = memberInvitedEvent.id
  await store.save<Membership>(invitedMember)
}

export async function members_StakingAccountAdded({ store, event }: EventContext & StoreContext): Promise<void> {
  const [accountId, memberId] = new Members.StakingAccountAddedEvent(event).params

  const stakingAccountAddedEvent = new StakingAccountAddedEvent({
    ...genericEventFields(event),
    member: new Membership({ id: memberId.toString() }),
    account: accountId.toString(),
  })

  await store.save<StakingAccountAddedEvent>(stakingAccountAddedEvent)
}

export async function members_StakingAccountConfirmed({ store, event }: EventContext & StoreContext): Promise<void> {
  const [accountId, memberId] = new Members.StakingAccountConfirmedEvent(event).params
  const member = await getMemberById(store, memberId)
  const eventTime = new Date(event.blockTimestamp)

  member.boundAccounts.push(accountId.toString())
  member.updatedAt = eventTime

  await store.save<Membership>(member)

  const stakingAccountConfirmedEvent = new StakingAccountConfirmedEvent({
    ...genericEventFields(event),
    member,
    account: accountId.toString(),
  })

  await store.save<StakingAccountConfirmedEvent>(stakingAccountConfirmedEvent)
}

export async function members_StakingAccountRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  const [accountId, memberId] = new Members.StakingAccountRemovedEvent(event).params
  const eventTime = new Date(event.blockTimestamp)
  const member = await getMemberById(store, memberId)

  member.boundAccounts.splice(
    member.boundAccounts.findIndex((a) => a === accountId.toString()),
    1
  )
  member.updatedAt = eventTime

  await store.save<Membership>(member)

  const stakingAccountRemovedEvent = new StakingAccountRemovedEvent({
    ...genericEventFields(event),
    member,
    account: accountId.toString(),
  })

  await store.save<StakingAccountRemovedEvent>(stakingAccountRemovedEvent)
}

export async function members_InitialInvitationCountUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newDefaultInviteCount] = new Members.InitialInvitationCountUpdatedEvent(event).params
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(ctx)

  membershipSystemSnapshot.defaultInviteCount = newDefaultInviteCount.toNumber()

  await store.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const initialInvitationCountUpdatedEvent = new InitialInvitationCountUpdatedEvent({
    ...genericEventFields(event),
    newInitialInvitationCount: newDefaultInviteCount.toNumber(),
  })

  await store.save<InitialInvitationCountUpdatedEvent>(initialInvitationCountUpdatedEvent)
}

export async function members_MembershipPriceUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newMembershipPrice] = new Members.MembershipPriceUpdatedEvent(event).params
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(ctx)

  membershipSystemSnapshot.membershipPrice = newMembershipPrice

  await store.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const membershipPriceUpdatedEvent = new MembershipPriceUpdatedEvent({
    ...genericEventFields(event),
    newPrice: newMembershipPrice,
  })

  await store.save<MembershipPriceUpdatedEvent>(membershipPriceUpdatedEvent)
}

export async function members_ReferralCutUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newReferralCut] = new Members.ReferralCutUpdatedEvent(event).params
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(ctx)

  membershipSystemSnapshot.referralCut = newReferralCut.toNumber()

  await store.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const referralCutUpdatedEvent = new ReferralCutUpdatedEvent({
    ...genericEventFields(event),
    newValue: newReferralCut.toNumber(),
  })

  await store.save<ReferralCutUpdatedEvent>(referralCutUpdatedEvent)
}

export async function members_InitialInvitationBalanceUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newInvitedInitialBalance] = new Members.InitialInvitationBalanceUpdatedEvent(event).params
  const membershipSystemSnapshot = await getOrCreateMembershipSnapshot(ctx)

  membershipSystemSnapshot.invitedInitialBalance = newInvitedInitialBalance

  await store.save<MembershipSystemSnapshot>(membershipSystemSnapshot)

  const initialInvitationBalanceUpdatedEvent = new InitialInvitationBalanceUpdatedEvent({
    ...genericEventFields(event),
    newInitialBalance: newInvitedInitialBalance,
  })

  await store.save<InitialInvitationBalanceUpdatedEvent>(initialInvitationBalanceUpdatedEvent)
}

export async function members_LeaderInvitationQuotaUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [newQuota] = new Members.LeaderInvitationQuotaUpdatedEvent(event).params

  const leaderInvitationQuotaUpdatedEvent = new LeaderInvitationQuotaUpdatedEvent({
    ...genericEventFields(event),
    newInvitationQuota: newQuota.toNumber(),
  })

  await store.save<LeaderInvitationQuotaUpdatedEvent>(leaderInvitationQuotaUpdatedEvent)
}
