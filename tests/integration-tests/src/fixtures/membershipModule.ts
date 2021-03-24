import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { BaseFixture } from '../Fixture'
import { MemberId } from '@joystream/types/common'
import Debugger from 'debug'
import { ISubmittableResult } from '@polkadot/types/types'
import { QueryNodeApi } from '../QueryNodeApi'
import { BuyMembershipParameters, Membership } from '@joystream/types/members'
import { Membership as QueryNodeMembership, MembershipEntryMethod } from '../QueryNodeApiSchema.generated'
import { blake2AsHex } from '@polkadot/util-crypto'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { CreateInterface, createType } from '@joystream/types'
import { MembershipMetadata } from '@joystream/metadata-protobuf'

// FIXME: Retrieve from runtime when possible!
const MINIMUM_STAKING_ACCOUNT_BALANCE = 200

type MemberContext = {
  account: string
  memberId: MemberId
}
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

  sendBuyMembershipTx(accountId: string): Promise<ISubmittableResult> {
    return this.api.signAndSend(this.generateBuyMembershipTx(accountId), accountId)
  }

  generateInviteMemberTx(memberId: MemberId, inviteeAccountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.inviteMember({
      ...this.generateParamsFromAccountId(inviteeAccountId),
      inviting_member_id: memberId,
    })
  }

  sendInviteMemberTx(memberId: MemberId, inviterAccount: string, inviteeAccount: string): Promise<ISubmittableResult> {
    return this.api.signAndSend(this.generateInviteMemberTx(memberId, inviteeAccount), inviterAccount)
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
      name,
      about,
      avatarUri,
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

  async execute(): Promise<void> {
    // Fee estimation and transfer
    const membershipFee: BN = await this.api.getMembershipFee()
    const membershipTransactionFee: BN = await this.api.estimateTxFee(
      this.generateBuyMembershipTx(this.accounts[0]),
      this.accounts[0]
    )
    const estimatedFee = membershipTransactionFee.add(new BN(membershipFee))

    await this.api.treasuryTransferBalanceToAccounts(this.accounts, estimatedFee)

    this.memberIds = (await Promise.all(this.accounts.map((account) => this.sendBuyMembershipTx(account))))
      .map(({ events }) => this.api.findMemberBoughtEvent(events))
      .filter((id) => id !== undefined) as MemberId[]

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
    for (const i in members) {
      const memberId = this.memberIds[i]
      const member = members[i]
      await this.query.tryQueryWithTimeout(
        () => this.query.getMemberById(memberId),
        (r) => this.assertMemberMatchQueriedResult(member, r.data.membership)
      )
    }
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

    const result = await this.sendBuyMembershipTx(this.account)

    this.expectDispatchError(result, 'Buying membership with insufficient funds should fail.')

    // Assert that failure occured for expected reason
    assert.equal(this.api.getErrorNameFromExtrinsicFailedRecord(result), 'NotEnoughBalanceToBuyMembership')
  }
}

export class UpdateProfileHappyCaseFixture extends BaseFixture {
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
    const { name, handle, avatarUri, about } = qMember as QueryNodeMembership
    assert.equal(name, this.newName)
    assert.equal(handle, this.newHandle)
    assert.equal(avatarUri, this.newAvatarUri)
    assert.equal(about, this.newAbout)
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
    await this.api.signAndSend(tx, this.memberContext.account)
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(this.memberContext.memberId),
      (res) => this.assertProfileUpdateSuccesful(res.data.membership)
    )
  }
}

export class UpdateAccountsHappyCaseFixture extends BaseFixture {
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

  async execute(): Promise<void> {
    const tx = this.api.tx.members.updateAccounts(
      this.memberContext.memberId,
      this.newRootAccount,
      this.newControllerAccount
    )
    const txFee = await this.api.estimateTxFee(tx, this.memberContext.account)
    await this.api.treasuryTransferBalance(this.memberContext.account, txFee)
    await this.api.signAndSend(tx, this.memberContext.account)
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(this.memberContext.memberId),
      (res) => this.assertAccountsUpdateSuccesful(res.data.membership)
    )
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
      name,
      about,
      avatarUri,
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

  async execute(): Promise<void> {
    const exampleTx = this.generateInviteMemberTx(this.inviterContext.memberId, this.accounts[0])
    const feePerTx = await this.api.estimateTxFee(exampleTx, this.inviterContext.account)
    await this.api.treasuryTransferBalance(this.inviterContext.account, feePerTx.muln(this.accounts.length))

    const initialInvitationBalance = await this.api.query.members.initialInvitationBalance()
    // Top up working group budget to allow funding invited members
    await this.api.makeSudoCall(
      this.api.tx.membershipWorkingGroup.setBudget(initialInvitationBalance.muln(this.accounts.length))
    )

    const { invites: initialInvitesCount } = await this.api.query.members.membershipById(this.inviterContext.memberId)

    const invitedMembersIds = (
      await Promise.all(
        this.accounts.map((account) =>
          this.sendInviteMemberTx(this.inviterContext.memberId, this.inviterContext.account, account)
        )
      )
    )
      .map(({ events }) => this.api.findMemberInvitedEvent(events))
      .filter((id) => id !== undefined) as MemberId[]

    await Promise.all(
      this.accounts.map((account, i) => {
        const memberId = invitedMembersIds[i]
        return this.query.tryQueryWithTimeout(
          () => this.query.getMemberById(memberId),
          (res) => this.assertMemberCorrectlyInvited(account, res.data.membership)
        )
      })
    )

    const {
      data: { membership: inviter },
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
    await this.api.signAndSend(tx, fromContext.account)
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(fromContext.memberId),
      ({ data: { membership: queriedFromMember } }) => {
        assert.isOk(queriedFromMember)
        assert.equal(queriedFromMember!.inviteCount, fromMember.invites.toNumber() - invitesToTransfer)
      }
    )
    const {
      data: { membership: queriedToMember },
    } = await this.query.getMemberById(toContext.memberId)
    assert.isOk(queriedToMember)
    assert.equal(queriedToMember!.inviteCount, toMember.invites.toNumber() + invitesToTransfer)
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

  async execute(): Promise<void> {
    const { memberContext, accounts } = this
    const addStakingCandidateTx = this.api.tx.members.addStakingAccountCandidate(memberContext.memberId)
    const confirmStakingAccountTxs = accounts.map((a) =>
      this.api.tx.members.confirmStakingAccount(memberContext.memberId, a)
    )
    const addStakingCandidateFee = await this.api.estimateTxFee(addStakingCandidateTx, accounts[0])
    const confirmStakingAccountFee = await this.api.estimateTxFee(confirmStakingAccountTxs[0], memberContext.account)

    await this.api.treasuryTransferBalance(memberContext.account, confirmStakingAccountFee.muln(accounts.length))
    const stakingAccountRequiredBalance = addStakingCandidateFee.addn(MINIMUM_STAKING_ACCOUNT_BALANCE)
    await Promise.all(accounts.map((a) => this.api.treasuryTransferBalance(a, stakingAccountRequiredBalance)))
    // Add staking account candidates
    await Promise.all(accounts.map((a) => this.api.signAndSend(addStakingCandidateTx, a)))
    // Confirm staking accounts
    await Promise.all(confirmStakingAccountTxs.map((tx) => this.api.signAndSend(tx, memberContext.account)))

    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(memberContext.memberId),
      ({ data: { membership } }) => {
        assert.isOk(membership)
        assert.isNotEmpty(membership!.boundAccounts)
        assert.includeMembers(membership!.boundAccounts, accounts)
      }
    )
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

  async execute(): Promise<void> {
    const { memberContext, accounts } = this
    const removeStakingAccountTx = this.api.tx.members.removeStakingAccount(memberContext.memberId)

    const removeStakingAccountFee = await this.api.estimateTxFee(removeStakingAccountTx, accounts[0])

    await Promise.all(accounts.map((a) => this.api.treasuryTransferBalance(a, removeStakingAccountFee)))
    // Remove staking accounts
    await Promise.all(accounts.map((a) => this.api.signAndSend(removeStakingAccountTx, a)))

    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(memberContext.memberId),
      ({ data: { membership } }) => {
        assert.isOk(membership)
        assert.notInclude(membership!.boundAccounts, accounts)
      }
    )
  }
}
