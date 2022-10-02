import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import { BN } from 'bn.js'
import { assert } from 'chai'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { ClaimingPayoutStakersSucceedsFixture } from '../../fixtures/staking/ClaimingPayoutStakersSucceedsFixture'

export default async function claimingPayoutsDisabled({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: claiming staking rewards is disabled in PoA ')
  debug('started')
  api.enableDebugTxLogs()

  // const nAccounts = 10
  // const bondAmount = new BN(1000000000)
  const sleepTimeSeconds = 20
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  // create n accounts
  // const stakerAccounts = (await api.createKeyPairs(nAccounts)).map(({ key }) => key.address)
  const getBalances = async (accounts: string[]) => Promise.all(accounts.map((account) => api.getBalance(account)))
  // get authorities
  const authorities = await api.getSessionAuthorities()
  const authoritiesStash = (await Promise.all(authorities.map((account) => api.getBonded(account)))).map((x) =>
    x.unwrap().toString()
  )
  const eraToReward = (await api.getCurrentEra()).unwrap().toNumber()

  // such accounts becomes stakers
  // await Promise.all(
  //   stakerAccounts.map(async (account) => {
  //     const bondingSucceedsFixture = new BondingSucceedsFixture(api, {
  //       stash: account,
  //       controller: account,
  //       bondAmount: bondAmount,
  //     })
  //     const fixtureRunner = new FixtureRunner(bondingSucceedsFixture)
  //     fixtureRunner.run()
  //   })
  // )

  const previousBalances = await getBalances(authoritiesStash)

  // wait k = 10 blocks
  sleep(sleepTimeSeconds * 1000)

  // attempt to claim payout for ALL validators
  await Promise.all(
    authoritiesStash.map(async (account) => {
      const claimingPayoutStakersSucceedsFixture = new ClaimingPayoutStakersSucceedsFixture(api, account, eraToReward)
      const fixtureRunner = new FixtureRunner(claimingPayoutStakersSucceedsFixture)
      fixtureRunner.run()
    })
  )

  debug('payout claimed')
  const currentBalances = await getBalances(authoritiesStash)

  // previous balances is equal to current balances
  assert.equal(previousBalances.length, currentBalances.length)
  assert.deepEqual(previousBalances, currentBalances)
}
