import { assert } from 'chai'
import { Api } from '../../Api'
import { BaseFixture } from '../../Fixture'

export class ClaimingPayoutStakersSucceedsFixture extends BaseFixture {
  protected claimingEra: number
  protected account: string
  protected validatorStash: string

  public constructor(api: Api, account: string, validatorStash: string, claimingEra: number) {
    super(api)
    this.account = account
    this.validatorStash = validatorStash
    this.claimingEra = claimingEra
  }

  async execute(): Promise<void> {
    const claimTx = this.api.tx.staking.payoutStakers(this.validatorStash, this.claimingEra)
    await this.api.prepareAccountsForFeeExpenses(this.account, [claimTx])
    const result = await this.api.signAndSend(claimTx, this.account)
    assert(result.isInBlock)
  }
}
