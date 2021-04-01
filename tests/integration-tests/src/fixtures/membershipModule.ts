import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { BaseFixture } from '../Fixture'
import { MemberId } from '@joystream/types/common'
import Debugger from 'debug'
import { QueryNodeApi } from '../QueryNodeApi'
import { BuyMembershipParameters, Membership } from '@joystream/types/members'
import {
  Membership as QueryNodeMembership,
  MembershipEntryMethod,
  MembershipBoughtEvent,
  EventType,
  MemberProfileUpdatedEvent,
  MemberAccountsUpdatedEvent,
  MemberInvitedEvent,
  InvitesTransferredEvent,
  StakingAccountAddedEvent,
  StakingAccountConfirmedEvent,
  StakingAccountRemovedEvent,
  Event,
} from '../QueryNodeApiSchema.generated'
import { blake2AsHex } from '@polkadot/util-crypto'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { CreateInterface, createType } from '@joystream/types'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { EventDetails, MemberInvitedEventDetails, MembershipBoughtEventDetails } from '../types'

// FIXME: Retrieve from runtime when possible!
const MINIMUM_STAKING_ACCOUNT_BALANCE = 200

type MemberContext = {
  account: string
  memberId: MemberId
}

type AnyQueryNodeEvent = { event: Event }

// common code for fixtures
abstract class MembershipFixture extends BaseFixture {
  generateParamsFromAccountId(accountId: string): CreateInterface<BuyMembershipParameters> {
    const metadata = new MembershipMetadata()
    metadata.setName(`name${accountId.substring(0, 14)}`)
    metadata.setAbout(`about${accountId.substring(0, 14)}`)
    metadata.setAvatarUri(`avatarUri${accountId.substring(0, 14)}`)
    return {
      root_account: accountId,
      controller_account: accountId,
      handle: `handle${accountId.substring(0, 14)}`,
      metadata: createType('Bytes', '0x' + Buffer.from(metadata.serializeBinary()).toString('hex')),
    }
  }

  generateBuyMembershipTx(accountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.buyMembership(this.generateParamsFromAccountId(accountId))
  }

  generateInviteMemberTx(memberId: MemberId, inviteeAccountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.inviteMember({
      ...this.generateParamsFromAccountId(inviteeAccountId),
      inviting_member_id: memberId,
    })
  }

  findMatchingQueryNodeEvent<T extends AnyQueryNodeEvent>(eventToFind: EventDetails, queryNodeEvents: T[]) {
    const { blockNumber, indexInBlock } = eventToFind
    const qEvent = queryNodeEvents.find((e) => e.event.inBlock === blockNumber && e.event.indexInBlock === indexInBlock)
    if (!qEvent) {
      throw new Error(`Could not find matching query-node event (expected ${blockNumber}:${indexInBlock})!`)
    }
    return qEvent
  }
}

export class BuyMembershipHappyCaseFixture extends MembershipFixture implements BaseFixture {
  private accounts: string[]
  private debug: Debugger.Debugger
  private memberIds: MemberId[] = []
  private query: QueryNodeApi

  public constructor(api: Api, query: QueryNodeApi, accounts: string[]) {
    super(api)
    this.accounts = accounts
    this.query = query
    this.debug = Debugger('fixture:BuyMembershipHappyCaseFixture')
  }

  public getCreatedMembers(): MemberId[] {
    return this.memberIds.slice()
  }

  private assertMemberMatchQueriedResult(member: Membership, qMember?: QueryNodeMembership | null) {
    assert.isOk(qMember, 'Membership query result is empty')
    const {
      handle,
      rootAccount,
      controllerAccount,
      metadata: { name, about, avatarUri },
      isVerified,
      entry,
    } = qMember as QueryNodeMembership
    const txParams = this.generateParamsFromAccountId(rootAccount)
    const metadata = MembershipMetadata.deserializeBinary(txParams.metadata.toU8a(true))
    assert.equal(blake2AsHex(handle), member.handle_hash.toString())
    assert.equal(handle, txParams.handle)
    assert.equal(rootAccount, member.root_account.toString())
    assert.equal(controllerAccount, member.controller_account.toString())
    assert.equal(name, metadata.getName())
    assert.equal(about, metadata.getAbout())
    assert.equal(avatarUri, metadata.getAvatarUri())
    assert.equal(isVerified, false)
    assert.equal(entry, MembershipEntryMethod.Paid)
  }

  private assertEventMatchQueriedResult(
    eventDetails: MembershipBoughtEventDetails,
    account: string,
    txHash: string,
    qEvents: MembershipBoughtEvent[]
  ) {
    assert.equal(qEvents.length, 1, `Invalid number of MembershipBoughtEvents recieved`)
    const [qEvent] = qEvents
    const txParams = this.generateParamsFromAccountId(account)
    const metadata = MembershipMetadata.deserializeBinary(txParams.metadata.toU8a(true))
    assert.equal(qEvent.event.inBlock, eventDetails.blockNumber)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.indexInBlock, eventDetails.indexInBlock)
    assert.equal(qEvent.event.type, EventType.MembershipBought)
    assert.equal(qEvent.newMember.id, eventDetails.memberId.toString())
    assert.equal(qEvent.handle, txParams.handle)
    assert.equal(qEvent.rootAccount, txParams.root_account.toString())
    assert.equal(qEvent.controllerAccount, txParams.controller_account.toString())
    assert.equal(qEvent.metadata.name, metadata.getName())
    assert.equal(qEvent.metadata.about, metadata.getAbout())
    assert.equal(qEvent.metadata.avatarUri, metadata.getAvatarUri())
  }

  async execute(): Promise<void> {
    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee()
    const membershipTransactionFee: BN = await this.api.estimateTxFee(
      this.generateBuyMembershipTx(this.accounts[0]),
      this.accounts[0]
    )
    const estimatedFee = membershipTransactionFee.add(new BN(membershipFee))

    await this.api.treasuryTransferBalanceToAccounts(this.accounts, estimatedFee)

    const extrinsics = this.accounts.map((a) => this.generateBuyMembershipTx(a))
    const results = await Promise.all(this.accounts.map((a, i) => this.api.signAndSend(extrinsics[i], a)))
    const events = await Promise.all(results.map((r) => this.api.retrieveMembershipBoughtEventDetails(r)))
    this.memberIds = events.map((e) => e.memberId)

    this.debug(`Registered ${this.memberIds.length} new members`)

    assert.equal(this.memberIds.length, this.accounts.length)

    // Assert that created members have expected root and controller accounts
    const members = await Promise.all(this.memberIds.map((id) => this.api.query.members.membershipById(id)))

    members.forEach((member, index) => {
      assert(member.root_account.eq(this.accounts[index]))
      assert(member.controller_account.eq(this.accounts[index]))
    })

    // Query-node part:

    // Ensure newly created members were parsed by query node
    await Promise.all(
      members.map(async (member, i) => {
        const memberId = this.memberIds[i]
        await this.query.tryQueryWithTimeout(
          () => this.query.getMemberById(memberId),
          (r) => this.assertMemberMatchQueriedResult(member, r.data.membershipByUniqueInput)
        )
        // Ensure the query node event is valid
        const res = await this.query.getMembershipBoughtEvents(memberId)
        this.assertEventMatchQueriedResult(
          events[i],
          this.accounts[i],
          extrinsics[i].hash.toString(),
          res.data.membershipBoughtEvents
        )
      })
    )
  }
}

export class BuyMembershipWithInsufficienFundsFixture extends MembershipFixture implements BaseFixture {
  private account: string

  public constructor(api: Api, account: string) {
    super(api)
    this.account = account
  }

  async execute(): Promise<void> {
    // It is acceptable for same account to register a new member account
    // So no need to assert that account is not already used as a controller or root for another member
    // const membership = await this.api.getMemberIds(this.account)
    // assert(membership.length === 0, 'Account must not be associated with a member')

    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee()
    const membershipTransactionFee: BN = await this.api.estimateTxFee(
      this.generateBuyMembershipTx(this.account),
      this.account
    )

    // Only provide enough funds for transaction fee but not enough to cover the membership fee
    await this.api.treasuryTransferBalance(this.account, membershipTransactionFee)

    const balance = await this.api.getBalance(this.account)

    assert(
      balance.toBn() < membershipFee.add(membershipTransactionFee),
      'Account already has sufficient balance to purchase membership'
    )

    const result = await this.api.signAndSend(this.generateBuyMembershipTx(this.account), this.account)

    this.expectDispatchError(result, 'Buying membership with insufficient funds should fail.')

    // Assert that failure occured for expected reason
    assert.equal(this.api.getErrorNameFromExtrinsicFailedRecord(result), 'NotEnoughBalanceToBuyMembership')
  }
}

// TODO: Add partial update to make sure it works too
export class UpdateProfileHappyCaseFixture extends MembershipFixture {
  private query: QueryNodeApi
  private memberContext: MemberContext
  // Update data
  private newName = 'New name'
  private newHandle = 'New handle'
  private newAvatarUri = 'New avatar uri'
  private newAbout = 'New about'

  public constructor(api: Api, query: QueryNodeApi, memberContext: MemberContext) {
    super(api)
    this.query = query
    this.memberContext = memberContext
  }

  private assertProfileUpdateSuccesful(qMember?: QueryNodeMembership | null) {
    assert.isOk(qMember, 'Membership query result is empty')
    const {
      handle,
      metadata: { name, avatarUri, about },
    } = qMember as QueryNodeMembership
    assert.equal(name, this.newName)
    assert.equal(handle, this.newHandle)
    assert.equal(avatarUri, this.newAvatarUri)
    assert.equal(about, this.newAbout)
  }

  private assertQueryNodeEventIsValid(
    eventDetails: EventDetails,
    txHash: string,
    qEvents: MemberProfileUpdatedEvent[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    const {
      event: { inExtrinsic, type },
      member: { id: memberId },
      newHandle,
      newMetadata,
    } = qEvent
    assert.equal(inExtrinsic, txHash)
    assert.equal(type, EventType.MemberProfileUpdated)
    assert.equal(memberId, this.memberContext.memberId.toString())
    assert.equal(newHandle, this.newHandle)
    assert.equal(newMetadata.name, this.newName)
    assert.equal(newMetadata.about, this.newAbout)
    assert.equal(newMetadata.avatarUri, this.newAvatarUri)
  }

  async execute(): Promise<void> {
    const metadata = new MembershipMetadata()
    metadata.setName(this.newName)
    metadata.setAbout(this.newAbout)
    metadata.setAvatarUri(this.newAvatarUri)
    const tx = this.api.tx.members.updateProfile(
      this.memberContext.memberId,
      this.newHandle,
      '0x' + Buffer.from(metadata.serializeBinary()).toString('hex')
    )
    const txFee = await this.api.estimateTxFee(tx, this.memberContext.account)
    await this.api.treasuryTransferBalance(this.memberContext.account, txFee)
    const txRes = await this.api.signAndSend(tx, this.memberContext.account)
    const txHash = tx.hash.toString()
    const updateEvent = await this.api.retrieveMembershipEventDetails(txRes, 'MemberProfileUpdated')
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(this.memberContext.memberId),
      (res) => this.assertProfileUpdateSuccesful(res.data.membershipByUniqueInput)
    )
    const res = await this.query.getMemberProfileUpdatedEvents(this.memberContext.memberId)
    this.assertQueryNodeEventIsValid(updateEvent, txHash, res.data.memberProfileUpdatedEvents)
  }
}

export class UpdateAccountsHappyCaseFixture extends MembershipFixture {
  private query: QueryNodeApi
  private memberContext: MemberContext
  // Update data
  private newRootAccount: string
  private newControllerAccount: string

  public constructor(api: Api, query: QueryNodeApi, memberContext: MemberContext) {
    super(api)
    this.query = query
    this.memberContext = memberContext
    const [newRootAccount, newControllerAccount] = this.api.createKeyPairs(2)
    this.newRootAccount = newRootAccount.address
    this.newControllerAccount = newControllerAccount.address
  }

  private assertAccountsUpdateSuccesful(qMember?: QueryNodeMembership | null) {
    assert.isOk(qMember, 'Membership query result is empty')
    const { rootAccount, controllerAccount } = qMember as QueryNodeMembership
    assert.equal(rootAccount, this.newRootAccount)
    assert.equal(controllerAccount, this.newControllerAccount)
  }

  private assertQueryNodeEventIsValid(
    eventDetails: EventDetails,
    txHash: string,
    qEvents: MemberAccountsUpdatedEvent[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    const {
      event: { inExtrinsic, type },
      member: { id: memberId },
      newControllerAccount,
      newRootAccount,
    } = qEvent
    assert.equal(inExtrinsic, txHash)
    assert.equal(type, EventType.MemberAccountsUpdated)
    assert.equal(memberId, this.memberContext.memberId.toString())
    assert.equal(newControllerAccount, this.newControllerAccount)
    assert.equal(newRootAccount, this.newRootAccount)
  }

  async execute(): Promise<void> {
    const tx = this.api.tx.members.updateAccounts(
      this.memberContext.memberId,
      this.newRootAccount,
      this.newControllerAccount
    )
    const txFee = await this.api.estimateTxFee(tx, this.memberContext.account)
    await this.api.treasuryTransferBalance(this.memberContext.account, txFee)
    const txRes = await this.api.signAndSend(tx, this.memberContext.account)
    const txHash = tx.hash.toString()
    const updateEvent = await this.api.retrieveMembershipEventDetails(txRes, 'MemberAccountsUpdated')
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(this.memberContext.memberId),
      (res) => this.assertAccountsUpdateSuccesful(res.data.membershipByUniqueInput)
    )
    const res = await this.query.getMemberAccountsUpdatedEvents(this.memberContext.memberId)
    this.assertQueryNodeEventIsValid(updateEvent, txHash, res.data.memberAccountsUpdatedEvents)
  }
}

export class InviteMembersHappyCaseFixture extends MembershipFixture {
  private query: QueryNodeApi
  private inviterContext: MemberContext
  private accounts: string[]

  public constructor(api: Api, query: QueryNodeApi, inviterContext: MemberContext, accounts: string[]) {
    super(api)
    this.query = query
    this.inviterContext = inviterContext
    this.accounts = accounts
  }

  private assertMemberCorrectlyInvited(account: string, qMember?: QueryNodeMembership | null) {
    assert.isOk(qMember, 'Membership query result is empty')
    const {
      handle,
      rootAccount,
      controllerAccount,
      metadata: { name, about, avatarUri },
      isVerified,
      entry,
      invitedBy,
    } = qMember as QueryNodeMembership
    const txParams = this.generateParamsFromAccountId(account)
    const metadata = MembershipMetadata.deserializeBinary(txParams.metadata.toU8a(true))
    assert.equal(handle, txParams.handle)
    assert.equal(rootAccount, txParams.root_account)
    assert.equal(controllerAccount, txParams.controller_account)
    assert.equal(name, metadata.getName())
    assert.equal(about, metadata.getAbout())
    assert.equal(avatarUri, metadata.getAvatarUri())
    assert.equal(isVerified, false)
    assert.equal(entry, MembershipEntryMethod.Invited)
    assert.isOk(invitedBy)
    assert.equal(invitedBy!.id, this.inviterContext.memberId.toString())
  }

  private aseertQueryNodeEventIsValid(
    eventDetails: MemberInvitedEventDetails,
    account: string,
    txHash: string,
    qEvents: MemberInvitedEvent[]
  ) {
    assert.isNotEmpty(qEvents)
    assert.equal(qEvents.length, 1, 'Unexpected number of MemberInvited events returned by query node')
    const [qEvent] = qEvents
    const txParams = this.generateParamsFromAccountId(account)
    const metadata = MembershipMetadata.deserializeBinary(txParams.metadata.toU8a(true))
    assert.equal(qEvent.event.inBlock, eventDetails.blockNumber)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.indexInBlock, eventDetails.indexInBlock)
    assert.equal(qEvent.event.type, EventType.MemberInvited)
    assert.equal(qEvent.newMember.id, eventDetails.newMemberId.toString())
    assert.equal(qEvent.handle, txParams.handle)
    assert.equal(qEvent.rootAccount, txParams.root_account)
    assert.equal(qEvent.controllerAccount, txParams.controller_account)
    assert.equal(qEvent.metadata.name, metadata.getName())
    assert.equal(qEvent.metadata.about, metadata.getAbout())
    assert.equal(qEvent.metadata.avatarUri, metadata.getAvatarUri())
  }

  async execute(): Promise<void> {
    const extrinsics = this.accounts.map((a) => this.generateInviteMemberTx(this.inviterContext.memberId, a))
    const feePerTx = await this.api.estimateTxFee(extrinsics[0], this.inviterContext.account)
    await this.api.treasuryTransferBalance(this.inviterContext.account, feePerTx.muln(this.accounts.length))

    const initialInvitationBalance = await this.api.query.members.initialInvitationBalance()
    // Top up working group budget to allow funding invited members
    await this.api.makeSudoCall(
      this.api.tx.membershipWorkingGroup.setBudget(initialInvitationBalance.muln(this.accounts.length))
    )

    const { invites: initialInvitesCount } = await this.api.query.members.membershipById(this.inviterContext.memberId)

    const txResults = await Promise.all(extrinsics.map((tx) => this.api.signAndSend(tx, this.inviterContext.account)))
    const events = await Promise.all(txResults.map((res) => this.api.retrieveMemberInvitedEventDetails(res)))
    const invitedMembersIds = events.map((e) => e.newMemberId)

    await Promise.all(
      this.accounts.map(async (account, i) => {
        const memberId = invitedMembersIds[i]
        await this.query.tryQueryWithTimeout(
          () => this.query.getMemberById(memberId),
          (res) => this.assertMemberCorrectlyInvited(account, res.data.membershipByUniqueInput)
        )
        const res = await this.query.getMemberInvitedEvents(memberId)
        this.aseertQueryNodeEventIsValid(
          events[i],
          account,
          extrinsics[i].hash.toString(),
          res.data.memberInvitedEvents
        )
      })
    )

    const {
      data: { membershipByUniqueInput: inviter },
    } = await this.query.getMemberById(this.inviterContext.memberId)
    assert.isOk(inviter)
    const { inviteCount, invitees } = inviter as QueryNodeMembership
    // Assert that inviteCount was correctly updated
    assert.equal(inviteCount, initialInvitesCount.toNumber() - this.accounts.length)
    // Assert that all invited members are part of "invetees" field
    assert.isNotEmpty(invitees)
    assert.includeMembers(
      invitees.map(({ id }) => id),
      invitedMembersIds.map((id) => id.toString())
    )
  }
}

export class TransferInvitesHappyCaseFixture extends MembershipFixture {
  private query: QueryNodeApi
  private fromContext: MemberContext
  private toContext: MemberContext
  private invitesToTransfer: number

  public constructor(
    api: Api,
    query: QueryNodeApi,
    fromContext: MemberContext,
    toContext: MemberContext,
    invitesToTransfer = 2
  ) {
    super(api)
    this.query = query
    this.fromContext = fromContext
    this.toContext = toContext
    this.invitesToTransfer = invitesToTransfer
  }

  private assertQueryNodeEventIsValid(eventDetails: EventDetails, txHash: string, qEvents: InvitesTransferredEvent[]) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    const {
      event: { inExtrinsic, type },
      sourceMember,
      targetMember,
      numberOfInvites,
    } = qEvent
    assert.equal(inExtrinsic, txHash)
    assert.equal(type, EventType.InvitesTransferred)
    assert.equal(sourceMember.id, this.fromContext.memberId.toString())
    assert.equal(targetMember.id, this.toContext.memberId.toString())
    assert.equal(numberOfInvites, this.invitesToTransfer)
  }

  async execute(): Promise<void> {
    const { fromContext, toContext, invitesToTransfer } = this
    const tx = this.api.tx.members.transferInvites(fromContext.memberId, toContext.memberId, invitesToTransfer)
    const txFee = await this.api.estimateTxFee(tx, fromContext.account)
    await this.api.treasuryTransferBalance(fromContext.account, txFee)

    const [fromMember, toMember] = await this.api.query.members.membershipById.multi<Membership>([
      fromContext.memberId,
      toContext.memberId,
    ])

    // Send transfer invites extrinsic
    const txRes = await this.api.signAndSend(tx, fromContext.account)
    const event = await this.api.retrieveMembershipEventDetails(txRes, 'InvitesTransferred')
    const txHash = tx.hash.toString()

    // Check "from" member
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(fromContext.memberId),
      ({ data: { membershipByUniqueInput: queriedFromMember } }) => {
        if (!queriedFromMember) {
          throw new Error('Source member not found')
        }
        assert.equal(queriedFromMember.inviteCount, fromMember.invites.toNumber() - invitesToTransfer)
      }
    )

    // Check "to" member
    const {
      data: { membershipByUniqueInput: queriedToMember },
    } = await this.query.getMemberById(toContext.memberId)
    if (!queriedToMember) {
      throw new Error('Target member not found')
    }
    assert.equal(queriedToMember.inviteCount, toMember.invites.toNumber() + invitesToTransfer)

    // Check event
    const {
      data: { invitesTransferredEvents },
    } = await this.query.getInvitesTransferredEvents(fromContext.memberId)

    this.assertQueryNodeEventIsValid(event, txHash, invitesTransferredEvents)
  }
}

export class AddStakingAccountsHappyCaseFixture extends MembershipFixture {
  private query: QueryNodeApi
  private memberContext: MemberContext
  private accounts: string[]

  public constructor(api: Api, query: QueryNodeApi, memberContext: MemberContext, accounts: string[]) {
    super(api)
    this.query = query
    this.memberContext = memberContext
    this.accounts = accounts
  }

  private assertQueryNodeAddAccountEventIsValid(
    eventDetails: EventDetails,
    account: string,
    txHash: string,
    qEvents: StakingAccountAddedEvent[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.type, EventType.StakingAccountAddedEvent)
    assert.equal(qEvent.member.id, this.memberContext.memberId.toString())
    assert.equal(qEvent.account, account)
  }

  private assertQueryNodeConfirmAccountEventIsValid(
    eventDetails: EventDetails,
    account: string,
    txHash: string,
    qEvents: StakingAccountConfirmedEvent[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.type, EventType.StakingAccountConfirmed)
    assert.equal(qEvent.member.id, this.memberContext.memberId.toString())
    assert.equal(qEvent.account, account)
  }

  async execute(): Promise<void> {
    const { memberContext, accounts } = this
    const addStakingCandidateTxs = accounts.map(() =>
      this.api.tx.members.addStakingAccountCandidate(memberContext.memberId)
    )
    const confirmStakingAccountTxs = accounts.map((a) =>
      this.api.tx.members.confirmStakingAccount(memberContext.memberId, a)
    )
    const addStakingCandidateFee = await this.api.estimateTxFee(addStakingCandidateTxs[0], accounts[0])
    const confirmStakingAccountFee = await this.api.estimateTxFee(confirmStakingAccountTxs[0], memberContext.account)

    await this.api.treasuryTransferBalance(memberContext.account, confirmStakingAccountFee.muln(accounts.length))
    const stakingAccountRequiredBalance = addStakingCandidateFee.addn(MINIMUM_STAKING_ACCOUNT_BALANCE)
    await Promise.all(accounts.map((a) => this.api.treasuryTransferBalance(a, stakingAccountRequiredBalance)))
    // Add staking account candidates
    const addResults = await Promise.all(accounts.map((a, i) => this.api.signAndSend(addStakingCandidateTxs[i], a)))
    const addEvents = await Promise.all(
      addResults.map((r) => this.api.retrieveMembershipEventDetails(r, 'StakingAccountAdded'))
    )
    // Confirm staking accounts
    const confirmResults = await Promise.all(
      confirmStakingAccountTxs.map((tx) => this.api.signAndSend(tx, memberContext.account))
    )
    const confirmEvents = await Promise.all(
      confirmResults.map((r) => this.api.retrieveMembershipEventDetails(r, 'StakingAccountConfirmed'))
    )

    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(memberContext.memberId),
      ({ data: { membershipByUniqueInput: membership } }) => {
        if (!membership) {
          throw new Error('Member not found')
        }
        assert.isNotEmpty(membership.boundAccounts)
        assert.includeMembers(membership.boundAccounts, accounts)
      }
    )

    // Check events
    const {
      data: { stakingAccountAddedEvents },
    } = await this.query.getStakingAccountAddedEvents(memberContext.memberId)
    const {
      data: { stakingAccountConfirmedEvents },
    } = await this.query.getStakingAccountConfirmedEvents(memberContext.memberId)
    accounts.forEach(async (account, i) => {
      this.assertQueryNodeAddAccountEventIsValid(
        addEvents[i],
        account,
        addStakingCandidateTxs[i].hash.toString(),
        stakingAccountAddedEvents
      )
      this.assertQueryNodeConfirmAccountEventIsValid(
        confirmEvents[i],
        account,
        confirmStakingAccountTxs[i].hash.toString(),
        stakingAccountConfirmedEvents
      )
    })
  }
}

export class RemoveStakingAccountsHappyCaseFixture extends MembershipFixture {
  private query: QueryNodeApi
  private memberContext: MemberContext
  private accounts: string[]

  public constructor(api: Api, query: QueryNodeApi, memberContext: MemberContext, accounts: string[]) {
    super(api)
    this.query = query
    this.memberContext = memberContext
    this.accounts = accounts
  }

  private assertQueryNodeRemoveAccountEventIsValid(
    eventDetails: EventDetails,
    account: string,
    txHash: string,
    qEvents: StakingAccountRemovedEvent[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.type, EventType.StakingAccountRemoved)
    assert.equal(qEvent.member.id, this.memberContext.memberId.toString())
    assert.equal(qEvent.account, account)
  }

  async execute(): Promise<void> {
    const { memberContext, accounts } = this
    const removeStakingAccountTxs = accounts.map(() => this.api.tx.members.removeStakingAccount(memberContext.memberId))

    const removeStakingAccountFee = await this.api.estimateTxFee(removeStakingAccountTxs[0], accounts[0])

    await Promise.all(accounts.map((a) => this.api.treasuryTransferBalance(a, removeStakingAccountFee)))
    // Remove staking accounts
    const results = await Promise.all(accounts.map((a, i) => this.api.signAndSend(removeStakingAccountTxs[i], a)))
    const events = await Promise.all(
      results.map((r) => this.api.retrieveMembershipEventDetails(r, 'StakingAccountRemoved'))
    )

    // Check member
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(memberContext.memberId),
      ({ data: { membershipByUniqueInput: membership } }) => {
        if (!membership) {
          throw new Error('Membership not found!')
        }
        accounts.forEach((a) => assert.notInclude(membership.boundAccounts, a))
      }
    )

    // Check events
    const {
      data: { stakingAccountRemovedEvents },
    } = await this.query.getStakingAccountRemovedEvents(memberContext.memberId)
    await Promise.all(
      accounts.map(async (account, i) => {
        this.assertQueryNodeRemoveAccountEventIsValid(
          events[i],
          account,
          removeStakingAccountTxs[i].hash.toString(),
          stakingAccountRemovedEvents
        )
      })
    )
  }
}
