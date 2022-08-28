import { Api } from '../../Api'
import { assert } from 'chai'
import { BaseFixture } from '../../Fixture'
import BN from 'bn.js'
import RpcError from '@polkadot/rpc-provider/coder/error'

type BondInput = {
  stash: string
  controller: string
  bondAmount: BN
}

export class BondingNotAllowedFixture extends BaseFixture {
  protected input: BondInput

  public constructor(api: Api, input: BondInput) {
    super(api)
    this.input = input
  }

  async execute(): Promise<void> {
    const bondTx = this.api.tx.staking.bond(this.input.controller, this.input.bondAmount, 'Stash')
    const fees = await this.api.estimateTxFee(bondTx, this.input.stash)
    await this.api.treasuryTransferBalance(this.input.stash, this.input.bondAmount.add(fees))

    try {
      await this.api.signAndSend(bondTx, this.input.stash)
      // Dispatch should never occur as SingnedExtension CheckCallAllowed should invalidate
      // transaction which tries to bond with a staked account.
      this.error(new Error(`Expected InvalidTransaction`))
    } catch (e) {
      // "1010: Invalid Transaction: Custom error: 1"
      // https://github.com/paritytech/substrate/blob/6cbe1772bf258793fa9845daa8f43ea0cadee596/client/rpc-api/src/author/error.rs#L105
      assert(e instanceof RpcError)
      assert.equal(e.code, 1010)
      assert.equal(e.data, 'Custom error: 1')
    }
  }
}
