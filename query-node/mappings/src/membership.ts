/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { IMemberRemarked, IMembershipMetadata, MemberRemarked, MembershipMetadata } from '@joystream/metadata-protobuf'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { isSet } from '@joystream/metadata-protobuf/utils'
import { MemberId } from '@joystream/types/primitives'
import { AccountId32, Balance } from '@polkadot/types/interfaces'
import { Bytes } from '@polkadot/types'
import {
  PalletMembershipBuyMembershipParameters as BuyMembershipParameters,
  PalletMembershipCreateMemberParameters as CreateMemberParameters,
  PalletMembershipGiftMembershipParameters as GiftMembershipParameters,
  PalletMembershipInviteMembershipParameters as InviteMembershipParameters,
} from '@polkadot/types/lookup'
import BN from 'bn.js'
import {
  App,
  AvatarUri,
  ChannelPaymentMadeEvent,
  Comment,
  InitialInvitationBalanceUpdatedEvent,
  InitialInvitationCountUpdatedEvent,
  InvitesTransferredEvent,
  LeaderInvitationQuotaUpdatedEvent,
  MemberAccountsUpdatedEvent,
  MemberCreatedEvent,
  MemberInvitedEvent,
  MemberMetadata,
  MemberProfileUpdatedEvent,
  MemberVerificationStatusUpdatedEvent,
  Membership,
  MembershipBoughtEvent,
  MembershipEntryGifted,
  MembershipEntryInvited,
  MembershipEntryMemberCreated,
  MembershipEntryMethod,
  MembershipEntryPaid,
  MembershipExternalResource,
  MembershipExternalResourceType,
  MembershipGiftedEvent,
  MembershipPriceUpdatedEvent,
  MetaprotocolTransactionSuccessful,
  ReferralCutUpdatedEvent,
  StakingAccountAddedEvent,
  StakingAccountConfirmedEvent,
  StakingAccountRemovedEvent,
  WorkingGroup,
} from 'query-node/dist/model'
import {
  Members_InitialInvitationBalanceUpdatedEvent_V1001 as InitialInvitationBalanceUpdatedEvent_V1001,
  Members_InitialInvitationCountUpdatedEvent_V1001 as InitialInvitationCountUpdatedEvent_V1001,
  Members_InvitesTransferredEvent_V1001 as InvitesTransferredEvent_V1001,
  Members_LeaderInvitationQuotaUpdatedEvent_V1001 as LeaderInvitationQuotaUpdatedEvent_V1001,
  Members_MemberAccountsUpdatedEvent_V1001 as MemberAccountsUpdatedEvent_V1001,
  Members_MemberCreatedEvent_V1001 as MemberCreatedEvent_V1001,
  Members_MemberInvitedEvent_V1001 as MemberInvitedEvent_V1001,
  Members_MemberInvitedEvent_V2001 as MemberInvitedEvent_V2001,
  Members_MemberProfileUpdatedEvent_V1001 as MemberProfileUpdatedEvent_V1001,
  Members_MemberRemarkedEvent_V1001 as MemberRemarkedEvent_V1001,
  Members_MemberRemarkedEvent_V2001 as MemberRemarkedEvent_V2001,
  Members_MemberVerificationStatusUpdatedEvent_V1001 as MemberVerificationStatusUpdatedEvent_V1001,
  Members_MembershipBoughtEvent_V1001 as MembershipBoughtEvent_V1001,
  Members_MembershipGiftedEvent_V1001 as MembershipGiftedEvent_V1001,
  Members_MembershipPriceUpdatedEvent_V1001 as MembershipPriceUpdatedEvent_V1001,
  Members_ReferralCutUpdatedEvent_V1001 as ReferralCutUpdatedEvent_V1001,
  Members_StakingAccountAddedEvent_V1001 as StakingAccountAddedEvent_V1001,
  Members_StakingAccountConfirmedEvent_V1001 as StakingAccountConfirmedEvent_V1001,
  Members_StakingAccountRemovedEvent_V1001 as StakingAccountRemovedEvent_V1001,
} from '../generated/types'
import { membershipConfig } from './bootstrap-data'
import {
  MetaprotocolTxError,
  RelationsArr,
  bytesToString,
  deserializeMetadata,
  genericEventFields,
  getMembershipById,
  getWorkerOrFail,
  getWorkingGroupByNameOrFail,
  invalidMetadata,
  saveMetaprotocolTransactionErrored,
  saveMetaprotocolTransactionSuccessful,
  toNumber,
} from './common'
import {
  processChannelPaymentFromMember,
  processCreateCommentMessage,
  processDeleteCommentMessage,
  processEditCommentMessage,
  processReactCommentMessage,
  processReactVideoMessage,
} from './content'
import { processCreateAppMessage, processUpdateAppMessage } from './content/app'
import { processCreateVideoCategoryMessage } from './content/videoCategory'

// Will only be used to get the initial balance till ephesus upgrade, after that it will be read from the event
async function initialInvitationBalance(store: DatabaseManager) {
  const lastInitialInvitationBalanceUpdateEvent = await store.get(InitialInvitationBalanceUpdatedEvent, {
    order: { inBlock: 'DESC', indexInBlock: 'DESC' },
  })
  return lastInitialInvitationBalanceUpdateEvent?.newInitialBalance || new BN(membershipConfig.initialInvitationBalance)
}

async function saveMembershipExternalResources(
  store: DatabaseManager,
  member: Membership,
  externalResources: Pick<MembershipExternalResource, 'type' | 'value'>[] = [],
  memberMetadata: MemberMetadata = member.metadata
): Promise<MembershipExternalResource[] | undefined> {
  const newExternalResources = externalResources.map(
    ({ type, value }) =>
      new MembershipExternalResource({
        id: `${memberMetadata.id}-${type}`,
        type,
        value,
        memberMetadata,
        member: member.metadata.externalResources ? undefined : member,
      })
  )
  for (const resource of newExternalResources) {
    await store.save<MembershipExternalResource>(resource)
  }

  return newExternalResources
}

function asMembershipExternalResource(
  resource: MembershipMetadata.IExternalResource
): Pick<MembershipExternalResource, 'type' | 'value'>[] {
  const typeKey = isSet(resource.type) && MembershipMetadata.ExternalResource.ResourceType[resource.type]

  if (typeKey && typeKey in MembershipExternalResourceType) {
    const type = MembershipExternalResourceType[typeKey]
    const value = resource.value
    return type && value ? [{ type, value }] : []
  } else {
    invalidMetadata(`Invalid ResourceType: ${resource.type}`)
    return []
  }
}

async function saveMembershipMetadata(
  store: DatabaseManager,
  member?: Membership,
  metadata?: DecodedMetadataObject<IMembershipMetadata> | null
): Promise<MemberMetadata> {
  const avatarUri =
    member?.metadata?.avatar && 'avatarUri' in member?.metadata.avatar
      ? member?.metadata.avatar.avatarUri
      : metadata?.avatarUri || ''
  const avatar = avatarUri ? new AvatarUri() : undefined
  if (avatar) {
    avatar.avatarUri = avatarUri
  }

  const metadataEntity = new MemberMetadata({
    name: metadata?.name || undefined,
    about: metadata?.about || undefined,
    ...member?.metadata,
    id: undefined,
    avatar,
    externalResources: undefined,
    isVerifiedValidator: false,
  })

  await store.save<MemberMetadata>(metadataEntity)

  if (member) {
    metadataEntity.externalResources = await saveMembershipExternalResources(
      store,
      member,
      member.metadata.externalResources,
      metadataEntity
    )
  }

  return metadataEntity
}

function setMemberHandle(member: Membership, handle: Bytes): Membership {
  member.handle = bytesToString(handle)
  member.handleRaw = handle.toHex()
  return member
}

async function createNewMemberFromParams(
  store: DatabaseManager,
  memberId: MemberId,
  entryMethod: typeof MembershipEntryMethod,
  params: BuyMembershipParameters | InviteMembershipParameters | GiftMembershipParameters | CreateMemberParameters,
  inviteCount: number,
  isFoundingMember = false
): Promise<Membership> {
  const { rootAccount, controllerAccount, handle, metadata: metadataBytes } = params
  const metadata = deserializeMetadata(MembershipMetadata, metadataBytes)

  const memberHandle = 'unwrap' in handle ? handle.unwrap() : handle
  const member = new Membership({
    id: memberId.toString(),
    rootAccount: rootAccount.toString(),
    controllerAccount: controllerAccount.toString(),
    metadata: await saveMembershipMetadata(store, undefined, metadata),
    entry: entryMethod,
    referredBy:
      entryMethod.isTypeOf === 'MembershipEntryPaid' && (params as BuyMembershipParameters).referrerId.isSome
        ? new Membership({
            id: (params as BuyMembershipParameters).referrerId.unwrap().toString(),
          })
        : undefined,
    isVerified: isFoundingMember,
    inviteCount,
    totalChannelsCreated: 0,
    boundAccounts: [],
    invitees: [],
    referredMembers: [],
    invitedBy:
      entryMethod.isTypeOf === 'MembershipEntryInvited'
        ? new Membership({
            id: (params as InviteMembershipParameters).invitingMemberId.toString(),
          })
        : undefined,
    isFoundingMember,
    isCouncilMember: false,

    councilCandidacies: [],
    councilMembers: [],
  })

  setMemberHandle(member, memberHandle)

  await store.save<Membership>(member)

  member.metadata.externalResources = await saveMembershipExternalResources(
    store,
    member,
    metadata?.externalResources?.flatMap(asMembershipExternalResource)
  )

  return member
}

export async function members_MembershipBought({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, buyMembershipParameters, inviteCount] = new MembershipBoughtEvent_V1001(event).params

  const memberEntry = new MembershipEntryPaid()
  const member = await createNewMemberFromParams(
    store,
    memberId,
    memberEntry,
    buyMembershipParameters,
    inviteCount.toNumber()
  )

  const membershipBoughtEvent = new MembershipBoughtEvent({
    ...genericEventFields(event),
    newMember: member,
    controllerAccount: member.controllerAccount,
    rootAccount: member.rootAccount,
    handle: member.handle,
    metadata: await saveMembershipMetadata(store, member),
    referrer: member.referredBy,
  })

  await store.save<MembershipBoughtEvent>(membershipBoughtEvent)

  // Update the other side of event<->membership relation
  memberEntry.membershipBoughtEventId = membershipBoughtEvent.id
  await store.save<Membership>(member)
}

export async function members_MembershipGifted({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, giftMembershipParameters] = new MembershipGiftedEvent_V1001(event).params

  const memberEntry = new MembershipEntryGifted()
  const member = await createNewMemberFromParams(store, memberId, memberEntry, giftMembershipParameters, 0)

  const membershipGiftedEvent = new MembershipGiftedEvent({
    ...genericEventFields(event),
    newMember: member,
    controllerAccount: member.controllerAccount,
    rootAccount: member.rootAccount,
    handle: member.handle,
    metadata: await saveMembershipMetadata(store, member),
  })

  await store.save<MembershipGiftedEvent>(membershipGiftedEvent)

  // Update the other side of event<->membership relation
  memberEntry.membershipGiftedEventId = membershipGiftedEvent.id
  await store.save<Membership>(member)
}

export async function members_MemberCreated({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, memberParameters, inviteCount] = new MemberCreatedEvent_V1001(event).params

  const memberEntry = new MembershipEntryMemberCreated()
  const member = await createNewMemberFromParams(
    store,
    memberId,
    memberEntry,
    memberParameters,
    inviteCount.toNumber(),
    memberParameters.isFoundingMember.isTrue
  )

  const memberCreatedEvent = new MemberCreatedEvent({
    ...genericEventFields(event),
    newMember: member,

    controllerAccount: member.controllerAccount,
    rootAccount: member.rootAccount,
    handle: member.handle,
    metadata: await saveMembershipMetadata(store, member),
    isFoundingMember: memberParameters.isFoundingMember.isTrue,
  })

  await store.save<MemberCreatedEvent>(memberCreatedEvent)

  // Update the other side of event<->membership relation
  memberEntry.memberCreatedEventId = memberCreatedEvent.id
  await store.save<Membership>(member)
}

export async function members_MemberProfileUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, newHandle, newMetadata] = new MemberProfileUpdatedEvent_V1001(event).params
  const metadata = newMetadata.isSome ? deserializeMetadata(MembershipMetadata, newMetadata.unwrap()) : undefined
  const member = await getMembershipById(store, memberId, [
    'metadata',
    'metadata.externalResources',
  ] as RelationsArr<Membership>)

  // FIXME: https://github.com/Joystream/hydra/issues/435
  if (typeof metadata?.name === 'string') {
    member.metadata.name = (metadata.name || null) as string | undefined
  }
  if (typeof metadata?.about === 'string') {
    member.metadata.about = (metadata.about || null) as string | undefined
  }

  if (typeof metadata?.avatarUri === 'string') {
    member.metadata.avatar = (metadata.avatarUri ? new AvatarUri() : null) as AvatarUri | undefined
    if (member.metadata.avatar) {
      member.metadata.avatar.avatarUri = metadata.avatarUri
    }
  }

  member.metadata.isVerifiedValidator = false

  if (newHandle.isSome) {
    setMemberHandle(member, newHandle.unwrap())
  }

  await store.save<MemberMetadata>(member.metadata)
  await store.save<Membership>(member)

  if (metadata?.externalResources) {
    // Remove previously set external resources
    for (const prevResource of member.metadata.externalResources ?? []) {
      await store.remove(prevResource)
    }
    member.metadata.externalResources = undefined

    // Save new external resources
    member.metadata.externalResources = await saveMembershipExternalResources(
      store,
      member,
      metadata?.externalResources?.flatMap(asMembershipExternalResource)
    )
  }

  const memberProfileUpdatedEvent = new MemberProfileUpdatedEvent({
    ...genericEventFields(event),
    member: member,
    newHandle: member.handle,
    newHandleRaw: member.handleRaw,
    newMetadata: await saveMembershipMetadata(store, member),
  })

  await store.save<MemberProfileUpdatedEvent>(memberProfileUpdatedEvent)
}

export async function members_MemberAccountsUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, newRootAccount, newControllerAccount] = new MemberAccountsUpdatedEvent_V1001(event).params
  const member = await getMembershipById(store, memberId)

  if (newControllerAccount.isSome) {
    member.controllerAccount = newControllerAccount.unwrap().toString()
  }
  if (newRootAccount.isSome) {
    member.rootAccount = newRootAccount.unwrap().toString()
  }

  await store.save<Membership>(member)

  const memberAccountsUpdatedEvent = new MemberAccountsUpdatedEvent({
    ...genericEventFields(event),
    member: member,
    newRootAccount: member.rootAccount,
    newControllerAccount: member.controllerAccount,
  })

  await store.save<MemberAccountsUpdatedEvent>(memberAccountsUpdatedEvent)
}

export async function members_MemberVerificationStatusUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [memberId, verificationStatus, workerId] = new MemberVerificationStatusUpdatedEvent_V1001(event).params
  const member = await getMembershipById(store, memberId)
  const worker = await getWorkerOrFail(store, 'membershipWorkingGroup', workerId)

  member.isVerified = verificationStatus.valueOf()

  await store.save<Membership>(member)

  const memberVerificationStatusUpdatedEvent = new MemberVerificationStatusUpdatedEvent({
    ...genericEventFields(event),
    member: member,
    isVerified: member.isVerified,
    worker,
  })

  await store.save<MemberVerificationStatusUpdatedEvent>(memberVerificationStatusUpdatedEvent)
}

export async function members_InvitesTransferred({ store, event }: EventContext & StoreContext): Promise<void> {
  const [sourceMemberId, targetMemberId, numberOfInvites] = new InvitesTransferredEvent_V1001(event).params
  const sourceMember = await getMembershipById(store, sourceMemberId)
  const targetMember = await getMembershipById(store, targetMemberId)

  sourceMember.inviteCount -= numberOfInvites.toNumber()
  targetMember.inviteCount += numberOfInvites.toNumber()

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

export async function members_MemberInvited({ store, event, block }: EventContext & StoreContext): Promise<void> {
  const { specVersion } = block.runtimeVersion
  const [memberId, inviteMembershipParameters, maybeInvitedMemberBalance] =
    parseInt(specVersion.toString()) === 1001
      ? new MemberInvitedEvent_V1001(event).params
      : new MemberInvitedEvent_V2001(event).params

  const entryMethod = new MembershipEntryInvited()
  const invitedMember = await createNewMemberFromParams(store, memberId, entryMethod, inviteMembershipParameters, 0)

  // Decrease invite count of inviting member
  const invitingMember = await getMembershipById(store, inviteMembershipParameters.invitingMemberId)
  invitingMember.inviteCount -= 1
  await store.save<Membership>(invitingMember)

  // Decrease working group budget
  const membershipWg = await getWorkingGroupByNameOrFail(store, 'membershipWorkingGroup')
  const invitedMemberBalance = maybeInvitedMemberBalance
    ? maybeInvitedMemberBalance.toBn()
    : await initialInvitationBalance(store)
  membershipWg.budget = membershipWg.budget.sub(invitedMemberBalance)
  await store.save<WorkingGroup>(membershipWg)

  const memberInvitedEvent = new MemberInvitedEvent({
    ...genericEventFields(event),
    invitingMember,
    newMember: invitedMember,
    handle: invitedMember.handle,
    rootAccount: invitedMember.rootAccount,
    controllerAccount: invitedMember.controllerAccount,
    metadata: await saveMembershipMetadata(store, invitedMember),
    initialBalance: invitedMemberBalance,
  })

  await store.save<MemberInvitedEvent>(memberInvitedEvent)

  // Update the other side of event<->member relationship
  entryMethod.memberInvitedEventId = memberInvitedEvent.id
  await store.save<Membership>(invitedMember)
}

export async function members_StakingAccountAdded({ store, event }: EventContext & StoreContext): Promise<void> {
  const [accountId, memberId] = new StakingAccountAddedEvent_V1001(event).params

  const stakingAccountAddedEvent = new StakingAccountAddedEvent({
    ...genericEventFields(event),
    member: new Membership({ id: memberId.toString() }),
    account: accountId.toString(),
  })

  await store.save<StakingAccountAddedEvent>(stakingAccountAddedEvent)
}

export async function members_StakingAccountConfirmed({ store, event }: EventContext & StoreContext): Promise<void> {
  const [accountId, memberId] = new StakingAccountConfirmedEvent_V1001(event).params
  const member = await getMembershipById(store, memberId)

  member.boundAccounts.push(accountId.toString())

  await store.save<Membership>(member)

  const stakingAccountConfirmedEvent = new StakingAccountConfirmedEvent({
    ...genericEventFields(event),
    member,
    account: accountId.toString(),
  })

  await store.save<StakingAccountConfirmedEvent>(stakingAccountConfirmedEvent)
}

export async function members_StakingAccountRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  const [accountId, memberId] = new StakingAccountRemovedEvent_V1001(event).params
  const member = await getMembershipById(store, memberId)

  member.boundAccounts.splice(
    member.boundAccounts.findIndex((a) => a === accountId.toString()),
    1
  )

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
  const [newDefaultInviteCount] = new InitialInvitationCountUpdatedEvent_V1001(event).params

  const initialInvitationCountUpdatedEvent = new InitialInvitationCountUpdatedEvent({
    ...genericEventFields(event),
    newInitialInvitationCount: newDefaultInviteCount.toNumber(),
  })

  await store.save<InitialInvitationCountUpdatedEvent>(initialInvitationCountUpdatedEvent)
}

export async function members_MembershipPriceUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newMembershipPrice] = new MembershipPriceUpdatedEvent_V1001(event).params

  const membershipPriceUpdatedEvent = new MembershipPriceUpdatedEvent({
    ...genericEventFields(event),
    newPrice: newMembershipPrice,
  })

  await store.save<MembershipPriceUpdatedEvent>(membershipPriceUpdatedEvent)
}

export async function members_ReferralCutUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newReferralCut] = new ReferralCutUpdatedEvent_V1001(event).params

  const referralCutUpdatedEvent = new ReferralCutUpdatedEvent({
    ...genericEventFields(event),
    newValue: newReferralCut.toNumber(),
  })

  await store.save<ReferralCutUpdatedEvent>(referralCutUpdatedEvent)
}

export async function members_InitialInvitationBalanceUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newInvitedInitialBalance] = new InitialInvitationBalanceUpdatedEvent_V1001(event).params

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
  const [newQuota] = new LeaderInvitationQuotaUpdatedEvent_V1001(event).params

  const groupName = 'membershipWorkingGroup'
  const group = await getWorkingGroupByNameOrFail(store, groupName, [
    'leader',
    'leader.membership',
  ] as RelationsArr<WorkingGroup>)

  const lead = group.leader!.membership
  lead.inviteCount = toNumber(newQuota)

  await store.save<Membership>(lead)

  const leaderInvitationQuotaUpdatedEvent = new LeaderInvitationQuotaUpdatedEvent({
    ...genericEventFields(event),
    newInvitationQuota: newQuota.toNumber(),
  })

  await store.save<LeaderInvitationQuotaUpdatedEvent>(leaderInvitationQuotaUpdatedEvent)
}

export async function members_MemberRemarked(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store, block } = ctx
  const { specVersion } = block.runtimeVersion
  const [memberId, metadataBytes, payment] =
    parseInt(specVersion.toString()) >= 2001
      ? new MemberRemarkedEvent_V2001(event).params
      : new MemberRemarkedEvent_V1001(event).params

  const member = await getMembershipById(store, memberId)
  const metadata = deserializeMetadata(MemberRemarked, metadataBytes)
  const metaprotocolTxResult = await processMemberRemark(ctx, member, metadata, payment?.unwrapOr(undefined))

  if (metaprotocolTxResult instanceof MetaprotocolTransactionSuccessful) {
    await saveMetaprotocolTransactionSuccessful(store, event, metaprotocolTxResult)
  } else {
    await saveMetaprotocolTransactionErrored(store, event, metaprotocolTxResult)
    invalidMetadata(`Bad metadata for member's remark:`, { metadata, metaprotocolTxResult })
  }
}

async function processMemberRemark(
  { store, event }: EventContext & StoreContext,
  member: Membership,
  decodedMetadata: DecodedMetadataObject<IMemberRemarked> | null,
  payment?: [AccountId32, Balance]
): Promise<MetaprotocolTransactionSuccessful | MetaprotocolTxError> {
  const metaprotocolTransactionSuccessful = new MetaprotocolTransactionSuccessful()
  if (decodedMetadata?.createApp) {
    const appOrError = await processCreateAppMessage(store, event, decodedMetadata.createApp, member)

    if (appOrError instanceof App) {
      return metaprotocolTransactionSuccessful
    }
    return appOrError
  }

  if (decodedMetadata?.updateApp) {
    const appOrError = await processUpdateAppMessage(store, decodedMetadata.updateApp, member)

    if (appOrError instanceof App) {
      return metaprotocolTransactionSuccessful
    }
    return appOrError
  }

  if (decodedMetadata?.reactVideo) {
    await processReactVideoMessage(store, event, member, decodedMetadata.reactVideo)

    return metaprotocolTransactionSuccessful
  }

  if (decodedMetadata?.reactComment) {
    const commentOrError = await processReactCommentMessage(store, event, member, decodedMetadata.reactComment)

    if (commentOrError instanceof Comment) {
      metaprotocolTransactionSuccessful.commentCreatedId = commentOrError.id
      return metaprotocolTransactionSuccessful
    }
    return commentOrError
  }

  if (decodedMetadata?.createComment) {
    const commentOrError = await processCreateCommentMessage(store, event, member, decodedMetadata.createComment)

    if (commentOrError instanceof Comment) {
      metaprotocolTransactionSuccessful.commentCreatedId = commentOrError.id
      return metaprotocolTransactionSuccessful
    }
    return commentOrError
  }

  if (decodedMetadata?.editComment) {
    const commentOrError = await processEditCommentMessage(store, event, member, decodedMetadata.editComment)
    if (commentOrError instanceof Comment) {
      metaprotocolTransactionSuccessful.commentEditedId = commentOrError.id
      return metaprotocolTransactionSuccessful
    }
    return commentOrError
  }

  if (decodedMetadata?.deleteComment) {
    const commentOrError = await processDeleteCommentMessage(store, event, member, decodedMetadata.deleteComment)

    if (commentOrError instanceof Comment) {
      metaprotocolTransactionSuccessful.commentDeletedId = commentOrError.id
      return metaprotocolTransactionSuccessful
    }
    return commentOrError
  }

  // Though the payments can be sent along with any arbitrary metadata message type,
  // however they will only be processed if the message type is 'makeChannelPayment'
  if (decodedMetadata?.makeChannelPayment) {
    if (!payment) {
      invalidMetadata(
        `payment info should be set when sending remark with 'makeChannelPayment' message type`,
        decodedMetadata
      )
      return MetaprotocolTxError.InvalidMetadata
    }

    const channelPaymentOrError = await processChannelPaymentFromMember(
      store,
      event,
      member,
      decodedMetadata.makeChannelPayment,
      payment
    )

    if (channelPaymentOrError instanceof ChannelPaymentMadeEvent) {
      metaprotocolTransactionSuccessful.channelPaidId = channelPaymentOrError.payeeChannel?.id || ''
      return metaprotocolTransactionSuccessful
    }
    return channelPaymentOrError
  }

  if (decodedMetadata?.createVideoCategory) {
    const videoCategory = await processCreateVideoCategoryMessage(store, event, decodedMetadata.createVideoCategory)
    metaprotocolTransactionSuccessful.videoCategoryCreatedId = videoCategory.id
    return metaprotocolTransactionSuccessful
  }

  return MetaprotocolTxError.InvalidMetadata
}
