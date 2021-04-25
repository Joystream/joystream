import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BaseMembershipFixture } from './BaseMembershipFixture'
import { EventDetails, MemberContext } from '../../types'
import { StakingAccountRemovedEventFieldsFragment } from '../../graphql/generated/queries'
import { EventType } from '../../graphql/generated/schema'

export class RemoveStakingAccountsHappyCaseFixture extends BaseMembershipFixture {
  private memberContext: MemberContext
  private accounts: string[]

  private events: EventDetails[] = []
  private extrinsics: SubmittableExtrinsic<'promise'>[] = []

  public constructor(api: Api, query: QueryNodeApi, memberContext: MemberContext, accounts: string[]) {
    super(api, query)
    this.memberContext = memberContext
    this.accounts = accounts
  }

  private assertQueryNodeRemoveAccountEventIsValid(
    eventDetails: EventDetails,
    account: string,
    txHash: string,
    qEvents: StakingAccountRemovedEventFieldsFragment[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.type, EventType.StakingAccountRemoved)
    assert.equal(qEvent.member.id, this.memberContext.memberId.toString())
    assert.equal(qEvent.account, account)
  }

  async execute(): Promise<void> {
    const { memberContext, accounts } = this
    this.extrinsics = accounts.map(() => this.api.tx.members.removeStakingAccount(memberContext.memberId))

    const removeStakingAccountFee = await this.api.estimateTxFee(this.extrinsics[0], accounts[0])

    await Promise.all(accounts.map((a) => this.api.treasuryTransferBalance(a, removeStakingAccountFee)))
    // Remove staking accounts
    const results = await Promise.all(accounts.map((a, i) => this.api.signAndSend(this.extrinsics[i], a)))
    this.events = await Promise.all(
      results.map((r) => this.api.retrieveMembershipEventDetails(r, 'StakingAccountRemoved'))
    )
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const { memberContext, accounts, events, extrinsics } = this
    // Check member
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(memberContext.memberId),
      (qMember) => {
        if (!qMember) {
          throw new Error('Query node: Membership not found!')
        }
        accounts.forEach((a) => assert.notInclude(qMember.boundAccounts, a))
      }
    )

    // Check events
    const qEvents = await this.query.getStakingAccountRemovedEvents(memberContext.memberId)
    await Promise.all(
      accounts.map(async (account, i) => {
        this.assertQueryNodeRemoveAccountEventIsValid(events[i], account, extrinsics[i].hash.toString(), qEvents)
      })
    )
  }
}
