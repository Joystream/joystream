import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { SetForceEraForcingNewFixture } from '../../fixtures/staking/SetForceEraForcingNewFixture'
import { assert } from 'chai'
import { BN } from 'bn.js'
import { ClaimingPayoutStakersSucceedsFixture } from '../../fixtures/staking/ClaimingPayoutStakersSucceedsFixture'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'

export default async function switchToNPoS({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: current era era must be some in NPoS')
  debug('started')
  api.enableDebugTxLogs()

  // ----------- ARRANGE ----------------

  // helpers
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const getBalances = async (accounts: string[]) => Promise.all(accounts.map((account) => api.getBalance(account)))

  // constants
  const nAccounts = 10
  const bondAmount = new BN(1000000000)
  const claimingEra = 10
  const sleepTimeSeconds = 20
  const stakerAccounts = (await api.createKeyPairs(nAccounts)).map(({ key }) => key.address)
  const genesisAuthorities = await api.getSessionAuthorities()

  // bond stakers
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
  const previousBalances = await getBalances(stakerAccounts.concat(genesisAuthorities))

  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNew, 'not on PoA')

  // ----------- ACT ----------------

  // 1. Switch to NPoS
  const setForceEraForcingNewFixture = new SetForceEraForcingNewFixture(api)
  const fixtureRunner = new FixtureRunner(setForceEraForcingNewFixture)
  await fixtureRunner.run()

  // 2. wait some time in for eras to be finalized
  sleep(sleepTimeSeconds * 1000)

  // 3. Claim payout for validators + genesis authorities
  await Promise.all(
    stakerAccounts.concat(genesisAuthorities).map(async (account) => {
      const claimingPayoutStakersSucceedsFixture = new ClaimingPayoutStakersSucceedsFixture(api, account, claimingEra)
      const fixtureRunner = new FixtureRunner(claimingPayoutStakersSucceedsFixture)
      fixtureRunner.run()
    })
  )

  // ----------- ASSERT ----------------

  // 1. Active era index increases
  const activeEra = await api.getActiveEra()
  assert(activeEra.isSome, 'active era is not some')
  const { index } = activeEra.unwrap()
  assert.isAbove(index.toNumber(), 0)

  // 2. Validators are able to claim payouts
  const currentBalances = await getBalances(stakerAccounts.concat(genesisAuthorities))
  assert(
    previousBalances
      .map((past, i) => past > currentBalances[i])
      .reduce((accumulator, iter) => iter || accumulator, false),
    "Validators couldn't claim payouts"
  )

  // 3. Election rounds have happened
  const electionRounds = await api.getElectionRounds()
  assert.isAbove(electionRounds.toNumber(), 0)
}
