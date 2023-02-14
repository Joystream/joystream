/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext, DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { Members } from '../generated/types'
import { MemberId } from '@joystream/types/primitives'
import {
  PalletMembershipBuyMembershipParameters as BuyMembershipParameters,
  PalletMembershipInviteMembershipParameters as InviteMembershipParameters,
  PalletMembershipGiftMembershipParameters as GiftMembershipParameters,
  PalletMembershipCreateMemberParameters as CreateMemberParameters,
} from '@polkadot/types/lookup'
import {
  MembershipMetadata,
  MemberRemarked,
  ICreateVideoCategory,
  IMembershipMetadata,
} from '@joystream/metadata-protobuf'
import { isSet } from '@joystream/metadata-protobuf/utils'
import {
  bytesToString,
  deserializeMetadata,
  genericEventFields,
  getWorker,
  toNumber,
  logger,
  saveMetaprotocolTransactionSuccessful,
  saveMetaprotocolTransactionErrored,
<<<<<<< HEAD
  getMemberById,
  unexpectedData,
=======
  getWorkingGroupByName,
>>>>>>> master
} from './common'
import {
  Membership,
  MembershipEntryMethod,
  MemberMetadata,
  MembershipBoughtEvent,
  MembershipGiftedEvent,
  MemberCreatedEvent,
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
  MembershipEntryGifted,
  MembershipEntryMemberCreated,
  AvatarUri,
  WorkingGroup,
  MembershipExternalResource,
  MembershipExternalResourceType,
  MetaprotocolTransactionSuccessful,
} from 'query-node/dist/model'
import {
  processReactVideoMessage,
  processReactCommentMessage,
  processCreateCommentMessage,
  processEditCommentMessage,
  processDeleteCommentMessage,
  processChannelPaymentFromMember,
} from './content'
import { createVideoCategory } from './content/videoCategory'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
<<<<<<< HEAD
import { AccountId32, Balance } from '@polkadot/types/interfaces'
=======
import { membershipConfig } from './bootstrap-data'
import { BN } from 'bn.js'

// FIXME: Should be emitted as part of MemberInvited event, but this requires a runtime upgrade
async function initialInvitationBalance(store: DatabaseManager) {
  const lastInitialInviationBalanceUpdateEvent = await store.get(InitialInvitationBalanceUpdatedEvent, {
    order: { inBlock: 'DESC', indexInBlock: 'DESC' },
  })
  return lastInitialInviationBalanceUpdateEvent?.newInitialBalance || new BN(membershipConfig.initialInvitationBalance)
}

async function getMemberById(store: DatabaseManager, id: MemberId, relations: string[] = []): Promise<Membership> {
  const member = await store.get(Membership, { where: { id: id.toString() }, relations })
  if (!member) {
    throw new Error(`Member(${id}) not found`)
  }
  return member
}
>>>>>>> master

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

  if (!typeKey || !(typeKey in MembershipExternalResourceType)) {
    throw new Error(`Invalid ResourceType: ${typeKey}`)
  }

  const type = MembershipExternalResourceType[typeKey]
  const value = resource.value
  return type && value ? [{ type, value }] : []
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

async function createNewMemberFromParams(
  store: DatabaseManager,
  event: SubstrateEvent,
  memberId: MemberId,
  entryMethod: typeof MembershipEntryMethod,
  params: BuyMembershipParameters | InviteMembershipParameters | GiftMembershipParameters | CreateMemberParameters,
  inviteCount: number,
  isFoundingMember = false
): Promise<Membership> {
  const { rootAccount, controllerAccount, handle, metadata: metadataBytes } = params
  const metadata = deserializeMetadata(MembershipMetadata, metadataBytes)

  const member = new Membership({
    id: memberId.toString(),
    rootAccount: rootAccount.toString(),
    controllerAccount: controllerAccount.toString(),
    handle: bytesToString('unwrap' in handle ? handle.unwrap() : handle),
    metadata: await saveMembershipMetadata(store, undefined, metadata),
    entry: entryMethod,
    referredBy:
      entryMethod.isTypeOf === 'MembershipEntryPaid' && (params as BuyMembershipParameters).referrerId.isSome
        ? new Membership({ id: (params as BuyMembershipParameters).referrerId.unwrap().toString() })
        : undefined,
    isVerified: isFoundingMember,
    inviteCount,
    boundAccounts: [],
    invitees: [],
    referredMembers: [],
    invitedBy:
      entryMethod.isTypeOf === 'MembershipEntryInvited'
        ? new Membership({ id: (params as InviteMembershipParameters).invitingMemberId.toString() })
        : undefined,
    isFoundingMember,
    isCouncilMember: false,

    councilCandidacies: [],
    councilMembers: [],
  })

  await store.save<Membership>(member)

  member.metadata.externalResources = await saveMembershipExternalResources(
    store,
    member,
    metadata?.externalResources?.flatMap(asMembershipExternalResource)
  )

  return member
}

export async function members_MembershipBought({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, buyMembershipParameters, inviteCount] = new Members.MembershipBoughtEvent(event).params

  const memberEntry = new MembershipEntryPaid()
  const member = await createNewMemberFromParams(
    store,
    event,
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
  const [memberId, giftMembershipParameters] = new Members.MembershipGiftedEvent(event).params

  const memberEntry = new MembershipEntryGifted()
  const member = await createNewMemberFromParams(store, event, memberId, memberEntry, giftMembershipParameters, 0)

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
  const [memberId, memberParameters, inviteCount] = new Members.MemberCreatedEvent(event).params

  const memberEntry = new MembershipEntryMemberCreated()
  const member = await createNewMemberFromParams(
    store,
    event,
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
  const [memberId, newHandle, newMetadata] = new Members.MemberProfileUpdatedEvent(event).params
  const metadata = newMetadata.isSome ? deserializeMetadata(MembershipMetadata, newMetadata.unwrap()) : undefined
  const member = await getMemberById(store, memberId, ['metadata', 'metadata.externalResources'])

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

  if (newHandle.isSome) {
    member.handle = bytesToString(newHandle.unwrap())
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
    newMetadata: await saveMembershipMetadata(store, member),
  })

  await store.save<MemberProfileUpdatedEvent>(memberProfileUpdatedEvent)
}

export async function members_MemberAccountsUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, newRootAccount, newControllerAccount] = new Members.MemberAccountsUpdatedEvent(event).params
  const member = await getMemberById(store, memberId)

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
  const [memberId, verificationStatus, workerId] = new Members.MemberVerificationStatusUpdatedEvent(event).params
  const member = await getMemberById(store, memberId)
  const worker = await getWorker(store, 'membershipWorkingGroup', workerId)

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
  const [sourceMemberId, targetMemberId, numberOfInvites] = new Members.InvitesTransferredEvent(event).params
  const sourceMember = await getMemberById(store, sourceMemberId)
  const targetMember = await getMemberById(store, targetMemberId)

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

export async function members_MemberInvited({ store, event }: EventContext & StoreContext): Promise<void> {
  const [memberId, inviteMembershipParameters] = new Members.MemberInvitedEvent(event).params
  const entryMethod = new MembershipEntryInvited()
  const invitedMember = await createNewMemberFromParams(
    store,
    event,
    memberId,
    entryMethod,
    inviteMembershipParameters,
    0
  )

  // Decrease invite count of inviting member
  const invitingMember = await getMemberById(store, inviteMembershipParameters.invitingMemberId)
  invitingMember.inviteCount -= 1
  await store.save<Membership>(invitingMember)

  // Decrease working group budget
  const membershipWg = await getWorkingGroupByName(store, 'membershipWorkingGroup')
  const invitedMemberBalance = await initialInvitationBalance(store)
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
  })

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
  const [accountId, memberId] = new Members.StakingAccountRemovedEvent(event).params
  const member = await getMemberById(store, memberId)

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
  const [newDefaultInviteCount] = new Members.InitialInvitationCountUpdatedEvent(event).params

  const initialInvitationCountUpdatedEvent = new InitialInvitationCountUpdatedEvent({
    ...genericEventFields(event),
    newInitialInvitationCount: newDefaultInviteCount.toNumber(),
  })

  await store.save<InitialInvitationCountUpdatedEvent>(initialInvitationCountUpdatedEvent)
}

export async function members_MembershipPriceUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newMembershipPrice] = new Members.MembershipPriceUpdatedEvent(event).params

  const membershipPriceUpdatedEvent = new MembershipPriceUpdatedEvent({
    ...genericEventFields(event),
    newPrice: newMembershipPrice,
  })

  await store.save<MembershipPriceUpdatedEvent>(membershipPriceUpdatedEvent)
}

export async function members_ReferralCutUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newReferralCut] = new Members.ReferralCutUpdatedEvent(event).params

  const referralCutUpdatedEvent = new ReferralCutUpdatedEvent({
    ...genericEventFields(event),
    newValue: newReferralCut.toNumber(),
  })

  await store.save<ReferralCutUpdatedEvent>(referralCutUpdatedEvent)
}

export async function members_InitialInvitationBalanceUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [newInvitedInitialBalance] = new Members.InitialInvitationBalanceUpdatedEvent(event).params

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

  const groupName = 'membershipWorkingGroup'
  const group = await store.get(WorkingGroup, {
    where: { name: groupName },
    relations: ['leader', 'leader.membership'],
  })

  if (!group) {
    throw new Error(`Working group ${groupName} not found!`)
  }

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
  const { event, store } = ctx
  const [memberId, message, payment] = new Members.MemberRemarkedEvent(event).params

  try {
    const decodedMessage = MemberRemarked.decode(message.toU8a(true))

    const metaTransactionInfo = await processMemberRemark(ctx, memberId, decodedMessage, payment.unwrapOr(undefined))

    await saveMetaprotocolTransactionSuccessful(store, event, metaTransactionInfo)

    // emit log event
    logger.info('Member remarked', { decodedMessage })
  } catch (error) {
    // emit log event
    logger.info(`Bad metadata for member's remark`, { error })

    // save metaprotocol info
    await saveMetaprotocolTransactionErrored(store, event, `Bad metadata for member's remark, error: ${error}}`)
  }
}

async function processMemberRemark(
  { store, event }: EventContext & StoreContext,
  memberId: MemberId,
  decodedMessage: MemberRemarked,
  payment?: [AccountId32, Balance]
): Promise<Partial<MetaprotocolTransactionSuccessful>> {
  const messageType = decodedMessage.memberRemarked

  if (messageType === 'reactVideo') {
    await processReactVideoMessage(store, event, memberId, decodedMessage.reactVideo!)

    return {}
  }

  if (messageType === 'reactComment') {
    await processReactCommentMessage(store, event, memberId, decodedMessage.reactComment!)

    return {}
  }

  if (messageType === 'createComment') {
    const comment = await processCreateCommentMessage(store, event, memberId, decodedMessage.createComment!)

    return { commentCreatedId: comment.id }
  }

  if (messageType === 'editComment') {
    const comment = await processEditCommentMessage(store, event, memberId, decodedMessage.editComment!)
    return { commentEditedId: comment.id }
  }

  if (messageType === 'deleteComment') {
    const comment = await processDeleteCommentMessage(store, event, memberId, decodedMessage.deleteComment!)
    return { commentDeletedId: comment.id }
  }

  // Though the payments can be sent along with any arbitrary metadata message type,
  // however they will only be processed if the message type is 'makeChannelPayment'
  if (messageType === 'makeChannelPayment') {
    if (!payment) {
      unexpectedData(
        `payment info should be set when sending remark with 'makeChannelPayment' message type`,
        messageType
      )
    }

    const channelPayment = await processChannelPaymentFromMember(
      store,
      event,
      memberId,
      decodedMessage.makeChannelPayment!,
      payment
    )
    return { channelPaidId: channelPayment.payeeChannel?.id }
  }

  if (messageType === 'createVideoCategory') {
    const createParams = decodedMessage.createVideoCategory as ICreateVideoCategory

    const videoCategory = await createVideoCategory(store, event, createParams)

    return { videoCategoryCreatedId: videoCategory.id }
  }

  // unknown message type
  return unexpectedData('Unsupported message type in member_remark action', messageType)
}
