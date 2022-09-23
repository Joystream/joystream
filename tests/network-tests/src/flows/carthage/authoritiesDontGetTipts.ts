import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import BN from 'bn.js'
import { BondingRestrictedFixture } from 'src/fixtures/staking/BondingRestrictedFixture'
import { FlowProps } from 'src/Flow'
import { assert } from 'chai'

export default async function authoritiesDontGetTips({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const nBlocks = 10
  const bondAmount = new BN(100000)

  // get authorities
  const authorities = await api.getAuthorities()
  const initialFreeBalances = await Promise.all(authorities.map((account) => api.getBalance(account)))

  // create 1 account and issue a bond Tx
  const stakerAccount = (await api.createKeyPairs(1)).map(({ key }) => key.address)[0]
  const bondingRestrictedFixture = new BondingRestrictedFixture(api, {
    stash: stakerAccount,
    controller: stakerAccount,
    bondAmount: bondAmount,
  })
  new FixtureRunner(bondingRestrictedFixture).run()

  // wait 10 blocks
  await api.untilBlock(nBlocks)

  const currentFreeBalances = await Promise.all(authorities.map((account) => api.getBalance(account)))
  assert.deepEqual(initialFreeBalances, currentFreeBalances)
}
