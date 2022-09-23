import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { BondingRestrictedFixture } from 'src/fixtures/staking/BondingRestrictedFixture'
import BN from 'bn.js'
import { assert } from 'chai'

export default async function validatorSet({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const nAccounts = 10
  const nBlocks = 100
  const bondAmount = new BN(100000)

  // create n accounts
  const stakerAccounts = (await api.createKeyPairs(nAccounts)).map(({ key }) => key.address)

  // such accounts becomes stakers
  await Promise.all(
    stakerAccounts.map((account) => {
      const bondingRestrictedFixture = new BondingRestrictedFixture(api, {
        stash: account,
        controller: account,
        bondAmount: bondAmount,
      })
      new FixtureRunner(bondingRestrictedFixture).run()
    })
  )

  // wait k = 10 blocks
  await api.untilBlock(nBlocks)

  // TODO: claim payouts

  // each payout (positive number) must be zero iff the sum is zero
  let totalReward: BN = (await Promise.all(stakerAccounts.map((account) => api.getBalance(account)))).reduce(
    (rewardAmount, accumulator: BN) => accumulator.add(new BN(rewardAmount)),
    0
  )
  assert.equal(totalReward, new BN(0))
}
