import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import BN from 'bn.js'
import { BondingSucceedsFixture } from 'src/fixtures/staking/BondingSucceedsFixture'
import { FlowProps } from 'src/Flow'
import { expect } from 'chai'

export default async function authoritiesDoGetTips({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug("flow: authorities don't get tips in PoA")
  debug('started')
  api.enableDebugTxLogs()

  const nBlocks = 10
  const bondAmount = new BN(100000)

  // get authorities
  const authorities = api.getAuthorities()
  //const initialFreeBalances = await Promise.all(authorities.map((account) => api.getBalance(account)))

  // create 1 account
  const stakerAccount = (await api.createKeyPairs(1)).map(({ key }) => key.address)[0]

  // issue a bond Tx
  const bondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: stakerAccount,
    controller: stakerAccount,
    bondAmount: bondAmount,
  })
  const fixtureRunner = new FixtureRunner(bondingSucceedsFixture)
  await fixtureRunner.run()

  // wait 10 blocks
  await api.untilBlock(nBlocks)

  // const currentFreeBalances = await Promise.all(authorities.map((account) => api.getBalance(account)))

  // expect(
  //   currentFreeBalances
  //     .map((currentBalance, i) => currentBalance > initialFreeBalances[i])
  //     .reduce((val: boolean, acc: boolean) => val && acc, true)
  // ).to.be.true
}
