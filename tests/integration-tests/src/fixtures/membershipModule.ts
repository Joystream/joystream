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
import { CreateInterface } from '@joystream/types'

// common code for fixtures
abstract class MembershipBuyer extends BaseFixture {
  generateParamsFromAccountId(accountId: string): CreateInterface<BuyMembershipParameters> {
    return {
      root_account: accountId,
      controller_account: accountId,
      handle: `handle${accountId.substring(0, 14)}`,
      name: `name${accountId.substring(0, 14)}`,
      about: `about${accountId.substring(0, 14)}`,
      avatar_uri: `avatarUri${accountId.substring(0, 14)}`,
    }
  }

  generateBuyMembershipTx(accountId: string): SubmittableExtrinsic<'promise'> {
    return this.api.tx.members.buyMembership(this.generateParamsFromAccountId(accountId))
  }

  sendBuyMembershipTx(accountId: string): Promise<ISubmittableResult> {
    return this.api.signAndSend(this.generateBuyMembershipTx(accountId), accountId)
  }
}

export class BuyMembershipHappyCaseFixture extends MembershipBuyer implements BaseFixture {
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
    assert.equal(blake2AsHex(handle), member.handle_hash.toString())
    assert.equal(handle, txParams.handle)
    assert.equal(rootAccount, member.root_account.toString())
    assert.equal(controllerAccount, member.controller_account.toString())
    assert.equal(name, txParams.name)
    assert.equal(about, txParams.about)
    assert.equal(avatarUri, txParams.avatar_uri)
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

export class BuyMembershipWithInsufficienFundsFixture extends MembershipBuyer implements BaseFixture {
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
  private memberController: string
  private memberId: MemberId
  // Update data
  private newName = 'New name'
  private newHandle = 'New handle'
  private newAvatarUri = 'New avatar uri'
  private newAbout = 'New about'

  public constructor(api: Api, query: QueryNodeApi, memberController: string, memberId: MemberId) {
    super(api)
    this.query = query
    this.memberController = memberController
    this.memberId = memberId
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
    const tx = this.api.tx.members.updateProfile(
      this.memberId,
      this.newName,
      this.newHandle,
      this.newAvatarUri,
      this.newAbout
    )
    const txFee = await this.api.estimateTxFee(tx, this.memberController)
    await this.api.treasuryTransferBalance(this.memberController, txFee)
    await this.api.signAndSend(tx, this.memberController)
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(this.memberId),
      (res) => this.assertProfileUpdateSuccesful(res.data.membership)
    )
  }
}

export class UpdateAccountsHappyCaseFixture extends BaseFixture {
  private query: QueryNodeApi
  private memberController: string
  private memberId: MemberId
  // Update data
  private newRootAccount: string
  private newControllerAccount: string

  public constructor(api: Api, query: QueryNodeApi, memberController: string, memberId: MemberId) {
    super(api)
    this.query = query
    this.memberController = memberController
    this.memberId = memberId
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
    const tx = this.api.tx.members.updateAccounts(this.memberId, this.newRootAccount, this.newControllerAccount)
    const txFee = await this.api.estimateTxFee(tx, this.memberController)
    await this.api.treasuryTransferBalance(this.memberController, txFee)
    await this.api.signAndSend(tx, this.memberController)
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(this.memberId),
      (res) => this.assertAccountsUpdateSuccesful(res.data.membership)
    )
  }
}
