import { Api } from '../../Api'
import { BaseFixture } from '../../Fixture'
import { AccountId32 } from '@polkadot/types/interfaces'
import { Keyring } from '@polkadot/api'

export class SetSudoKeyFixture extends BaseFixture {
  protected new_key: number

  public constructor(api: Api, new_key: number) {
    super(api)
    this.new_key = new_key
  }

  async execute(): Promise<void> {
    const keyring = new Keyring()
    keyring.setSS58Format(0)
    console.log("about to add key")
    const address = keyring.addFromAddress(this.new_key.toString()).address
    console.log("key added")
    const tx = this.api.tx.sudo.setKey(address)
    await this.api.makeSudoCall(tx)
  }
}
