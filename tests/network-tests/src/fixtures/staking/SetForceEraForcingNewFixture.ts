import { BaseFixture } from '../../Fixture'

export class SetForceEraForcingNewFixture extends BaseFixture {
  async execute(): Promise<void> {
    // Send the actual sudo transaction
    const forceTx = this.api.tx.staking.forceNewEra()
    await this.api.makeSudoCall(forceTx)
  }
}
