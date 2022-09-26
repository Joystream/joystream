import { Api } from '../../Api'
import { BaseFixture } from '../../Fixture'
import { Vec } from '@polkadot/types/codec'
import { AccountId32 } from '@polkadot/types/interfaces'

export class NominatingSucceedsFixture extends BaseFixture {
  protected targets: Vec<AccountId32>
  protected controller: string

  public constructor(api: Api, targets: Vec<AccountId32>, controller: string) {
    super(api)
    this.controller = controller
    this.targets = targets
  }

  async execute(): Promise<void> {
    const nominateTx = this.api.tx.staking.nominate(this.targets)
    const fees = await this.api.estimateTxFee(nominateTx, this.controller)
    await this.api.treasuryTransferBalance(this.controller, fees)

    const result = await this.api.signAndSend(nominateTx, this.controller)
    this.expectDispatchSuccess(result, 'Not successful')
  }
}
