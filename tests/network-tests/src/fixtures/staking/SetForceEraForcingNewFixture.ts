import { BaseFixture } from '../../Fixture'
import { Keyring } from '@polkadot/api'

export class SetForceEraForcingNewFixture extends BaseFixture {
  async execute(): Promise<void> {
    const keyring = new Keyring({ type: 'sr25519' })

    const sudoKey = await this.api.query.sudo.key()
    const sudoPair = keyring.getPair(sudoKey.toString())

    // Send the actual sudo transaction
    const forceTx = this.api.tx.staking.forceNewEra()
    await this.api.tx.sudo.sudo(forceTx).signAndSend(sudoPair)

    // this.expectDispatchSuccess(result, "error sending sudo TX")
  }
}
