import { Api } from '../../Api'
import { BaseFixture } from '../../Fixture'

export class SetForceEraForcingNewFixture extends BaseFixture {
  public constructor(api: Api) {
    super(api)
  }

  async execute(): Promise<void> {
    const sudoKey = (await this.api.query.sudo.key()).value.toString()
    const forceTx = this.api.tx.staking.forceNewEra()
    const fee = await this.api.estimateTxFee(forceTx, sudoKey)
    await this.api.treasuryTransferBalance(sudoKey, fee)

    const result = await this.api.signAndSend(forceTx, sudoKey)
    this.expectDispatchError(result, 'ForceEra not changed')
  }
}
