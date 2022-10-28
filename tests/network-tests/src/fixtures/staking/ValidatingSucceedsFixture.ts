import { JoystreamNodeRuntimeSessionKeys, PalletStakingValidatorPrefs } from '@polkadot/types/lookup'
import { assert } from 'chai'
import { Api } from '../../Api'
import { BaseFixture } from '../../Fixture'

export class ValidatingSucceedsFixture extends BaseFixture {
  protected preferences: PalletStakingValidatorPrefs
  protected controller: string
  protected sessionKeys: JoystreamNodeRuntimeSessionKeys | undefined

  public constructor(
    api: Api,
    preferences: PalletStakingValidatorPrefs,
    controller: string,
    sessionKeys?: JoystreamNodeRuntimeSessionKeys
  ) {
    super(api)
    this.controller = controller
    this.preferences = preferences
    this.sessionKeys = sessionKeys
  }

  async execute(): Promise<void> {
    const transactions = [this.api.tx.staking.validate(this.preferences)]
    if (this.sessionKeys) {
      transactions.push(this.api.tx.session.setKeys(this.sessionKeys, ''))
    }
    await this.api.prepareAccountsForFeeExpenses(this.controller, transactions)
    const results = await this.api.sendExtrinsicsAndGetResults(transactions, this.controller)
    assert(results.every((r) => r.isInBlock))

    const validatorEntry = (await this.api.query.staking.validators.entries()).find(
      ([sKey, prefs]) => sKey.args[0].eq(this.controller) && prefs.eq(this.preferences)
    )
    assert(
      validatorEntry,
      `validator entry not found (${this.controller}, ${JSON.stringify(this.preferences.toHuman())})`
    )

    if (this.sessionKeys) {
      const nextControllerSessionKeys = await this.api.query.session.nextKeys(this.controller)
      assert(nextControllerSessionKeys.eq(this.sessionKeys), 'invalid session.nextKeys')
    }
  }
}
