import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { BN } from 'bn.js'
import { expect } from 'chai'
import { BondingSucceedsFixture } from 'src/fixtures/staking/BondingSucceedsFixture'
import { ClaimingPayoutStakersSucceedsFixture } from 'src/fixtures/staking/ClaimingPayoutStakersSucceedsFixture'

export default async function claimingPayoutsEnabled({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: claiming staking rewards is disabled in PoA ')
  debug('started')
  api.enableDebugTxLogs()

  const nAccounts = 10
  const nBlocks = 100
  const bondAmount = new BN(100000)
  const claimingEra = 10

  // create n accounts
  const stakerAccounts = (await api.createKeyPairs(nAccounts)).map(({ key }) => key.address)

  // get authorities
  const authorities = (await api.getSessionAuthorities()).map((key) => key.toString())

  // such accounts becomes stakers
  await Promise.all(
    stakerAccounts.map(async (account) => {
      const bondingSucceedsFixture = new BondingSucceedsFixture(api, {
        stash: account,
        controller: account,
        bondAmount: bondAmount,
      })
      const fixtureRunner = new FixtureRunner(bondingSucceedsFixture)
      fixtureRunner.run()
    })
  )

  const previousBalances = await Promise.all(stakerAccounts.map((account) => api.getBalance(account)))

  // wait k = 10 blocks
  await api.untilBlock(nBlocks)

  // attempt to claim payout for ALL validators
  await Promise.all(
    stakerAccounts.concat(authorities).map(async (account) => {
      const claimingPayoutStakersSucceedsFixture = new ClaimingPayoutStakersSucceedsFixture(api, account, claimingEra)
      const fixtureRunner = new FixtureRunner(claimingPayoutStakersSucceedsFixture)
      fixtureRunner.run()
    })
  )

  // each payout (positive pnumber) must be zero iff the sum is zero
  const currentBalances = await Promise.all(stakerAccounts.map((account) => api.getBalance(account)))

  const result = previousBalances
    .map((past, i) => past > currentBalances[i])
    .reduce((accumulator, iter) => iter || accumulator, false)

  expect(result).to.be.true
}
