import { Api } from '../../Api'
import { BaseFixture } from '../../Fixture'

export class ClaimingPayoutStakersSucceedsFixture extends BaseFixture {
  protected claimingEra: number
  protected account: string

  public constructor(api: Api, account: string, claimingEra: number) {
    super(api)
    this.account = account
    this.claimingEra = claimingEra
  }

  async execute(): Promise<void> {
    const claimTx = this.api.tx.staking.payoutStakers(this.account, this.claimingEra)
    const fees = await this.api.estimateTxFee(claimTx, this.account)
    await this.api.treasuryTransferBalance(this.account, fees)

    await this.api.signAndSend(claimTx, this.account)
  }
}
