import { Api } from '../../Api'
import { BaseFixture } from '../../Fixture'
import BN from 'bn.js'

type BondInput = {
  stash: string
  controller: string
  bondAmount: BN
}

export class BondingSucceedsFixture extends BaseFixture {
  protected input: BondInput

  public constructor(api: Api, input: BondInput) {
    super(api)
    this.input = input
  }

  async execute(): Promise<void> {
    const bondTx = this.api.tx.staking.bond(this.input.controller, this.input.bondAmount, 'Stash')
    const fees = await this.api.estimateTxFee(bondTx, this.input.stash)
    await this.api.treasuryTransferBalance(this.input.stash, this.input.bondAmount.add(fees))

    const result = await this.api.signAndSend(bondTx, this.input.stash)
    // this.expectDispatchSuccess(result, 'Not successful')
  }
}
