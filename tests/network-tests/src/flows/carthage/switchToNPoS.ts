import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { SetForceEraForcingNewFixture } from '../../fixtures/staking/SetForceEraForcingNewFixture'
import { assert } from 'chai'
import { ClaimingPayoutStakersSucceedsFixture } from '../../fixtures/staking/ClaimingPayoutStakersSucceedsFixture'
import { u32 } from '@polkadot/types'
import { PalletStakingValidatorPrefs } from '@polkadot/types/lookup'
import { ValidatingSucceedsFixture } from '../../fixtures/staking/ValidatingSucceedsFixture'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { NominatingSucceedsFixture } from '../../fixtures/staking/NominatingSucceedsFixture'

export default async function switchToNPoS({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: current era era must be some in NPoS')
  debug('started')
  api.enableDebugTxLogs()

  // ----------- ARRANGE ----------------

  // helpers
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const getBalances = async (accounts: string[]) => Promise.all(accounts.map((account) => api.getBalance(account)))

  // constants
  const sleepTimeSeconds = 10

  const authoritiesStash = await api.getSessionAuthorities()
  const eraToReward = (await api.getCurrentEra()).unwrap().toNumber()
  const previousBalances = await getBalances(authoritiesStash)

  // ensure that we are in PoA at era 0
  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone, 'not on PoA')
  let activeEra = (await api.getActiveEra()).unwrap()
  assert.equal(activeEra.index.toString(), '0', 'starting active era is not zero')

  // create 1 nominator and 1 validator (besides genesis authorities)
  const nominatorBond = await api.query.staking.minNominatorBond()
  const validatorBond = await api.query.staking.minValidatorBond()
  const [nominatorAccount, validatorAccount] = (await api.createKeyPairs(2)).map(({ key }) => key.address)

  const nominatorBondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: nominatorAccount,
    controller: nominatorAccount,
    bondAmount: nominatorBond,
  })
  const nominatorFixture = new FixtureRunner(nominatorBondingSucceedsFixture)
  await nominatorFixture.run()

  const validatorBondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: validatorAccount,
    controller: validatorAccount,
    bondAmount: validatorBond,
  })
  const validatorFixture = new FixtureRunner(validatorBondingSucceedsFixture)
  await validatorFixture.run()

  const validatorCandidatingSucceedsFixture = new ValidatingSucceedsFixture(
    api,
    api.createType('PalletStakingValidatorPrefs', {
      'commission': 0,
      'blocked': false,
    }),
    validatorAccount
  )
  const candidationFixture = new FixtureRunner(validatorCandidatingSucceedsFixture)
  await candidationFixture.run()

  const nominatorCandidatingSucceedsFixture = new NominatingSucceedsFixture(api, [validatorAccount], nominatorAccount)
  const nominationFixture = new FixtureRunner(nominatorCandidatingSucceedsFixture)
  await nominationFixture.run()


  // ---------------------- ACT --------------------------------

  // Switch to NPoS
  const setForceEraForcingNewFixture = new SetForceEraForcingNewFixture(api)
  const fixtureRunner = new FixtureRunner(setForceEraForcingNewFixture)
  await fixtureRunner.run()

  // And wait until new era happened: about 10 minutes
  while (activeEra.index.toString() === '0') {
    await sleep(sleepTimeSeconds * 1000)
    activeEra = (await api.getActiveEra()).unwrap()
  }

  // ------------------------- ASSERT ---------------------------

  // 1. Nex Era Starting session index is Some
  const { index } = (await api.getActiveEra()).unwrap()
  const nextEraStartingSessionIndex = await api.getErasStartSessionIndex(index.addn(1) as u32)
  assert(nextEraStartingSessionIndex.isSome, 'next era starting session index is not set')

  // 2 ---------------- Era rewards checks -----------------------
  // 2.a Check that genesis authorities claim for era 0 is 0
  await Promise.all(
    authoritiesStash.map(async (account) => {
      const claimingPayoutStakersSucceedsFixture = new ClaimingPayoutStakersSucceedsFixture(api, account, eraToReward)
      const fixtureRunner = new FixtureRunner(claimingPayoutStakersSucceedsFixture)
      fixtureRunner.run()
    })
  )
  const currentBalances = await getBalances(authoritiesStash)
  assert.deepEqual(previousBalances, currentBalances)

  // 3. ----------------- Election checks -----------------------
  // 3.a. Election rounds have happened
  const electionRounds = await api.getElectionRounds()
  assert.isAbove(electionRounds.toNumber(), 1, 'no new election rounds have happened')

  // 3.b. current election snapshots contains new targets and voters
  const electionRoundSnapshot = (await api.getElectionSnapshot()).unwrap()
  const electionTargets = electionRoundSnapshot.targets.map((account) => account.toString())
  assert.include(electionTargets, validatorAccount, 'extra validator not considered')
  const electionVoters = electionRoundSnapshot.voters.map(([account,]) => account.toString())
  assert.include(electionVoters, nominatorAccount, 'extra nominators not considered')


}
