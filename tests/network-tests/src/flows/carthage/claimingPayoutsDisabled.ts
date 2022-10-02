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

  const nAccounts = 10
  const bondAmount = new BN(1000000000)
  const claimingEra = 10
  const sleepTimeSeconds = 20
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  // create n accounts
  const stakerAccounts = (await api.createKeyPairs(nAccounts)).map(({ key }) => key.address)
  const getBalances = async (accounts: string[]) => Promise.all(accounts.map((account) => api.getBalance(account)))
  // get authorities
  const authorities = (await api.getSessionAuthorities()).map((account) => account.toString())

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

  const previousBalances = await getBalances(stakerAccounts)

  // wait k = 10 blocks
  sleep(sleepTimeSeconds * 1000)

  // attempt to claim payout for ALL validators
  await Promise.all(
    stakerAccounts.concat(authorities).map(async (account) => {
      const claimingPayoutStakersSucceedsFixture = new ClaimingPayoutStakersSucceedsFixture(api, account, claimingEra)
      const fixtureRunner = new FixtureRunner(claimingPayoutStakersSucceedsFixture)
      fixtureRunner.run()
    })
  )
  debug('payout claimed')

  const currentBalances = await getBalances(stakerAccounts)

  // previous balances is equal to current balances
  assert.deepEqual(previousBalances, currentBalances)
}
