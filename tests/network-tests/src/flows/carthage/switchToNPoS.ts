import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { SetForceEraForcingNewFixture } from '../../fixtures/staking/SetForceEraForcingNewFixture'
import { assert } from 'chai'
import { BN } from 'bn.js'
import { ClaimingPayoutStakersSucceedsFixture } from '../../fixtures/staking/ClaimingPayoutStakersSucceedsFixture'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { u32 } from '@polkadot/types'

export default async function switchToNPoS({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: current era era must be some in NPoS')
  debug('started')
  api.enableDebugTxLogs()

  // ----------- ARRANGE ----------------

  // helpers
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const getBalances = async (accounts: string[]) => Promise.all(accounts.map((account) => api.getBalance(account)))
  const authorities = await api.getSessionAuthorities()
  const authoritiesStash = (await Promise.all(authorities.map((account) => api.getBonded(account)))).map((x) =>
    x.unwrap().toString()
  )
  const eraToReward = (await api.getCurrentEra()).unwrap().toNumber()

  // constants
  const nAccounts = 10
  const bondAmount = new BN(1000000000)
  const claimingEra = 10
  const sleepTimeSeconds = 30
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
  const previousBalances = await getBalances(authoritiesStash)

  // ensure that we are in PoA
  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone, 'not on PoA')

  // ----------- ACT ----------------

  // 1. Switch to NPoS
  const setForceEraForcingNewFixture = new SetForceEraForcingNewFixture(api)
  const fixtureRunner = new FixtureRunner(setForceEraForcingNewFixture)
  await fixtureRunner.run()

  // wait until new era happened: about 10 minutes
  let forceEraStatus = await api.getForceEra()
  while (forceEraStatus.isForceNew) {
    sleep(sleepTimeSeconds * 1000)
    forceEraStatus = await api.getForceEra()
  }

  // ----------- ASSERT ----------------

  // 1. Nex Era Starting session index is Some
  const { index } = (await api.getActiveEra()).unwrap()
  const nextEraStartingSessionIndex = await api.getErasStartSessionIndex(index.addn(1) as u32)
  assert(nextEraStartingSessionIndex.isSome, 'ext era starting session index is not some')

  // 2. Check that genesis authorities claim for era 0 is 0
  await Promise.all(
    authoritiesStash.map(async (account) => {
      const claimingPayoutStakersSucceedsFixture = new ClaimingPayoutStakersSucceedsFixture(api, account, eraToReward)
      const fixtureRunner = new FixtureRunner(claimingPayoutStakersSucceedsFixture)
      fixtureRunner.run()
    })
  )
  const currentBalances = await getBalances(authoritiesStash)
  assert.deepEqual(previousBalances, currentBalances)

  // 3. Election rounds have happened
  const electionRounds = await api.getElectionRounds()
  assert.isAbove(electionRounds.toNumber(), 0)
}
