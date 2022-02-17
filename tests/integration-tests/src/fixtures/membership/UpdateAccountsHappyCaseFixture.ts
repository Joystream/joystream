import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BaseQueryNodeFixture } from '../../Fixture'
import { EventDetails, MemberContext } from '../../types'
import { MemberAccountsUpdatedEventFieldsFragment, MembershipFieldsFragment } from '../../graphql/generated/queries'

export class UpdateAccountsHappyCaseFixture extends BaseQueryNodeFixture {
  private memberContext: MemberContext
  // Update data
  private newRootAccount: string
  private newControllerAccount: string

  private tx?: SubmittableExtrinsic<'promise'>
  private event?: EventDetails

  public constructor(
    api: Api,
    query: QueryNodeApi,
    memberContext: MemberContext,
    newRootAccount: string,
    newControllerAccount: string
  ) {
    super(api, query)
    this.memberContext = memberContext
    this.newRootAccount = newRootAccount
    this.newControllerAccount = newControllerAccount
  }

  private assertAccountsUpdateSuccesful(qMember: MembershipFieldsFragment | null) {
    if (!qMember) {
      throw new Error('Query node: Membership not found!')
    }
    const { rootAccount, controllerAccount } = qMember
    assert.equal(rootAccount, this.newRootAccount)
    assert.equal(controllerAccount, this.newControllerAccount)
  }

  private assertQueryNodeEventIsValid(
    eventDetails: EventDetails,
    txHash: string,
    qEvents: MemberAccountsUpdatedEventFieldsFragment[]
  ) {
    const qEvent = this.findMatchingQueryNodeEvent(eventDetails, qEvents)
    const {
      inExtrinsic,
      member: { id: memberId },
      newControllerAccount,
      newRootAccount,
    } = qEvent
    assert.equal(inExtrinsic, txHash)
    assert.equal(memberId, this.memberContext.memberId.toString())
    assert.equal(newControllerAccount, this.newControllerAccount)
    assert.equal(newRootAccount, this.newRootAccount)
  }

  async execute(): Promise<void> {
    this.tx = this.api.tx.members.updateAccounts(
      this.memberContext.memberId,
      this.newRootAccount,
      this.newControllerAccount
    )
    const txFee = await this.api.estimateTxFee(this.tx, this.memberContext.account)
    await this.api.treasuryTransferBalance(this.memberContext.account, txFee)
    const txRes = await this.api.signAndSend(this.tx, this.memberContext.account)
    this.event = await this.api.getEventDetails(txRes, 'members', 'MemberAccountsUpdated')
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    await this.query.tryQueryWithTimeout(
      () => this.query.getMemberById(this.memberContext.memberId),
      (qMember) => this.assertAccountsUpdateSuccesful(qMember)
    )
    const qEvents = await this.query.getMemberAccountsUpdatedEvents(this.memberContext.memberId)
    this.assertQueryNodeEventIsValid(this.event!, this.tx!.hash.toString(), qEvents)
  }
}
