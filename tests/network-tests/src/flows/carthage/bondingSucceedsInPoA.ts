import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import BN from 'bn.js'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { assert } from 'chai'

export default async function bondingSucceedsInPoA({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: bonding succeeds in PoA')
  debug('started')
  api.enableDebugTxLogs()

  const bondAmount = new BN(100000)

  // we are in poa
  const currentEra = await api.getCurrentEra()
  assert(currentEra.isNone)

  // create keys and bonding tx
  const account = (await api.createKeyPairs(1))[0].key.address

  const bondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: account,
    controller: account,
    bondAmount: bondAmount,
  })
  const fixtureRunner = new FixtureRunner(bondingSucceedsFixture)
  await fixtureRunner.run()
}
