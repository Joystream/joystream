import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import { assert } from 'chai'
import BN from 'bn.js'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { ValidatingSucceedsFixture } from '../../fixtures/staking/ValidatingSucceedsFixture'

export default async function validateSucceedsInPoA({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validate succeeds in PoA')
  debug('started')
  api.enableDebugTxLogs()

  const bondAmount = new BN(1000000000000000)

  // we are in poa
  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone)

  // create keys
  const account = (await api.createKeyPairs(1))[0].key.address

  // bond Tx
  const bondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: account,
    controller: account,
    bondAmount: bondAmount,
  })
  const fixtureRunner = new FixtureRunner(bondingSucceedsFixture)
  await fixtureRunner.run()

  // candidate validator
  const validatorCandidatingSucceedsFixture = new ValidatingSucceedsFixture(
    api,
    {
      'commission': 1,
      'blocked': false,
    },
    account
  )
  const candidationFixture = new FixtureRunner(validatorCandidatingSucceedsFixture)
  await candidationFixture.run()
}
