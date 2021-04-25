import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BaseMembershipFixture } from './BaseMembershipFixture'
import { MemberContext, EventDetails } from '../../types'
import {
  StakingAccountAddedEventFieldsFragment,
  StakingAccountConfirmedEventFieldsFragment,
} from '../../graphql/generated/queries'
import { EventType } from '../../graphql/generated/schema'
import { MINIMUM_STAKING_ACCOUNT_BALANCE } from '../../consts'

export class AddStakingAccountsHappyCaseFixture extends BaseMembershipFixture {
  private memberContext: MemberContext
  private accounts: string[]

  private addExtrinsics: SubmittableExtrinsic<'promise'>[] = []
  private confirmExtrinsics: SubmittableExtrinsic<'promise'>[] = []
  private addEvents: EventDetails[] = []
  private confirmEvents: EventDetails[] = []

  public constructor(api: Api, query: QueryNodeApi, memberContext: MemberContext, accounts: string[]) {
    super(api, query)
    this.memberContext = memberContext
    this.accounts = accounts
  }

  private assertQueryNodeAddAccountEventIsValid(
    eventDetails: EventDetails,
    account: string,
    txHash: string,
    qEvents: StakingAccountAddedEventFieldsFragment[]
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
    qEvents: StakingAccountConfirmedEventFieldsFragment[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.type, EventType.StakingAccountConfirmed)
    assert.equal(qEvent.member.id, this.memberContext.memberId.toString())
    assert.equal(qEvent.account, account)
  }

  async execute(): Promise<void> {
    const { memberContext, accounts } = this
    this.addExtrinsics = accounts.map(() => this.api.tx.members.addStakingAccountCandidate(memberContext.memberId))
    this.confirmExtrinsics = accounts.map((a) => this.api.tx.members.confirmStakingAccount(memberContext.memberId, a))
    const addStakingCandidateFee = await this.api.estimateTxFee(this.addExtrinsics[0], accounts[0])
    const confirmStakingAccountFee = await this.api.estimateTxFee(this.confirmExtrinsics[0], memberContext.account)

    await this.api.treasuryTransferBalance(memberContext.account, confirmStakingAccountFee.muln(accounts.length))
    const stakingAccountRequiredBalance = addStakingCandidateFee.addn(MINIMUM_STAKING_ACCOUNT_BALANCE)
    await Promise.all(accounts.map((a) => this.api.treasuryTransferBalance(a, stakingAccountRequiredBalance)))
    // Add staking account candidates
    const addResults = await Promise.all(accounts.map((a, i) => this.api.signAndSend(this.addExtrinsics[i], a)))
    this.addEvents = await Promise.all(
      addResults.map((r) => this.api.retrieveMembershipEventDetails(r, 'StakingAccountAdded'))
    )
    // Confirm staking accounts
    const confirmResults = await Promise.all(
      this.confirmExtrinsics.map((tx) => this.api.signAndSend(tx, memberContext.account))
    )
    this.confirmEvents = await Promise.all(
      confirmResults.map((r) => this.api.retrieveMembershipEventDetails(r, 'StakingAccountConfirmed'))
    )
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const { memberContext, accounts, addEvents, confirmEvents, addExtrinsics, confirmExtrinsics } = this
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(memberContext.memberId),
      (qMember) => {
        if (!qMember) {
          throw new Error('Query node: Member not found')
        }
        assert.isNotEmpty(qMember.boundAccounts)
        assert.includeMembers(qMember.boundAccounts, accounts)
      }
    )

    // Check events
    const qAddedEvents = await this.query.getStakingAccountAddedEvents(memberContext.memberId)
    const qConfirmedEvents = await this.query.getStakingAccountConfirmedEvents(memberContext.memberId)
    accounts.forEach(async (account, i) => {
      this.assertQueryNodeAddAccountEventIsValid(addEvents[i], account, addExtrinsics[i].hash.toString(), qAddedEvents)
      this.assertQueryNodeConfirmAccountEventIsValid(
        confirmEvents[i],
        account,
        confirmExtrinsics[i].hash.toString(),
        qConfirmedEvents
      )
    })
  }
}
