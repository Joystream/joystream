import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { FixtureRunner } from '../../Fixture'
import { SetForceEraForcingNewFixture } from '../../fixtures/staking/SetForceEraForcingNewFixture'
import { assert } from 'chai'
import { ClaimingPayoutStakersSucceedsFixture } from '../../fixtures/staking/ClaimingPayoutStakersSucceedsFixture'
import { ValidatingSucceedsFixture } from '../../fixtures/staking/ValidatingSucceedsFixture'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { NominatingSucceedsFixture } from '../../fixtures/staking/NominatingSucceedsFixture'

export default async function switchToNPoS({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: current era era must be some in NPoS')
  debug('started')
  api.enableDebugTxLogs()

  // ----------- ARRANGE ----------------

  // helpers
  const getBalances = async (accounts: string[]) => Promise.all(accounts.map((account) => api.getBalance(account)))

  const authoritiesStash = await api.getSessionAuthorities()
  const previousBalances = await getBalances(authoritiesStash)
  const babeAuthoritiesEra0 = await api.getBabeAuthorities()

  // ensure that we are in PoA at era 0
  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone, 'not on PoA')
  const activeEra = (await api.getActiveEra()).unwrap()
  assert.equal(activeEra.index.toString(), '0', 'starting active era is not zero')

  // create 1 nominator and 1 validator (besides genesis authorities)
  debug('preparing a new validator and nominator...')
  const currentTopValidatorStake = (await api.query.staking.erasStakers.entries(0))
    .map(([, v]) => v.total.toBn())
    .reduce((a, b) => (b.gt(a) ? b : a))
  const nominatorBond = await api.query.staking.minNominatorBond()
  // New validator's stake will be higher than any existing validator's total stake
  // AND higher than the `carthagePoAAssertions` validator's stake
  const validatorBond = currentTopValidatorStake.addn(2)
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

  const validatorSessionKeys = api.createType('JoystreamNodeRuntimeSessionKeys', await api.rpc.author.rotateKeys())
  const validatorCandidatingSucceedsFixture = new ValidatingSucceedsFixture(
    api,
    api.createType('PalletStakingValidatorPrefs', {
      'commission': 0,
      'blocked': false,
    }),
    validatorAccount,
    validatorSessionKeys
  )
  const candidationFixture = new FixtureRunner(validatorCandidatingSucceedsFixture)
  await candidationFixture.run()

  const nominatorCandidatingSucceedsFixture = new NominatingSucceedsFixture(api, [validatorAccount], nominatorAccount)
  const nominationFixture = new FixtureRunner(nominatorCandidatingSucceedsFixture)
  await nominationFixture.run()

  // ---------------------- ACT --------------------------------

  debug('setting forceEra to ForceNew...')
  // Switch to NPoS
  const setForceEraForcingNewFixture = new SetForceEraForcingNewFixture(api)
  const fixtureRunner = new FixtureRunner(setForceEraForcingNewFixture)
  await fixtureRunner.run()

  // get chain constants and set test timeout
  const sessionDurationInSlots = api.consts.babe.epochDuration.toNumber()
  const slotTimeMs = api.consts.babe.expectedBlockTime.toNumber()
  const sessionsPerEra = api.consts.staking.sessionsPerEra.toNumber()
  const timeoutMs = sessionDurationInSlots * slotTimeMs * sessionsPerEra * 3
  const testTimeout = setTimeout(() => {
    throw new Error('Timeout reached')
  }, timeoutMs)

  try {
    // Wait until active elections...
    debug('waiting until active elections...')
    await new Promise((resolve) => {
      const unsub = api.query.electionProviderMultiPhase.currentPhase(async (electionPhase) => {
        if (!electionPhase.isOff) {
          ;(await unsub)()
          resolve(electionPhase)
        }
      })
    })
    // ------------------------- ASSERT ---------------------------
    debug('checking active election assertions...')

    // ----------------- Election checks -----------------------
    // Election snapshot contains new targets and voters
    const electionRoundSnapshot = (await api.getElectionSnapshot()).unwrap()
    const electionTargets = electionRoundSnapshot.targets.map((account) => account.toString())
    assert.include(electionTargets, validatorAccount, 'extra validator not considered')
    const electionVoters = electionRoundSnapshot.voters.map(([account]) => account.toString())
    assert.include(electionVoters, nominatorAccount, 'extra nominators not considered')
    // First election is triggered before new era begins
    const electionsActiveEra = await api.getActiveEra()
    assert.equal(electionsActiveEra.unwrap().index.toNumber(), 0, 'active era during first election should still be 0!')

    // ---------------------- ACT --------------------------------
    // Wait until 1st era...
    debug('waiting until era 1 begins...')
    await new Promise((resolve) => {
      const unsub = api.query.staking.activeEra(async (era) => {
        if (era.unwrap().index.eqn(1)) {
          ;(await unsub)()
          resolve(era)
        }
      })
    })
    // ------------------------- ASSERT ---------------------------
    debug('checking era 1 assertions...')

    // ------------- Election checks -----------------------------
    // Number of election rounds is == 2
    const electionRounds = await api.getElectionRounds()
    assert.equal(electionRounds.toNumber(), 2)

    // ---------------- Era rewards checks -----------------------
    // Check that total validator rewards for era 0 are === 0
    const totalValidatorRewardsEra0 = await api.query.staking.erasValidatorReward(0)
    assert.equal(totalValidatorRewardsEra0.toString(), '0')
    // Check that genesis authorities (validators) claim for era 0 is 0
    await Promise.all(
      authoritiesStash.map(async (stash) => {
        const claimingPayoutStakersSucceedsFixture = new ClaimingPayoutStakersSucceedsFixture(
          api,
          validatorAccount, // claiming account (can be anyone)
          stash,
          0
        )
        const fixtureRunner = new FixtureRunner(claimingPayoutStakersSucceedsFixture)
        await fixtureRunner.run()
      })
    )
    const currentBalances = await getBalances(authoritiesStash)
    assert.deepEqual(previousBalances, currentBalances)

    // ----------------- Validator set checks -----------------------
    // New validator is now a babe authority
    const babeAuthoritiesEra1 = await api.getBabeAuthorities()
    assert.deepEqual(babeAuthoritiesEra1, [validatorSessionKeys.babe.toString()])
    // Previous validator got replaced
    assert.notDeepEqual(babeAuthoritiesEra1, babeAuthoritiesEra0)

    // ---------------------- ACT --------------------------------
    // Wait until 2nd era...
    debug('waiting until era 2 begins...')
    await new Promise((resolve) => {
      const unsub = api.query.staking.activeEra(async (era) => {
        if (era.unwrap().index.eqn(2)) {
          ;(await unsub)()
          resolve(era)
        }
      })
    })

    // ------------------------- ASSERT ---------------------------
    debug('checking era 2 assertions...')

    // ------------- Election checks -----------------------------
    // number of election rounds is == 3
    const electionRoundsEra2 = await api.getElectionRounds()
    assert.equal(electionRoundsEra2.toNumber(), 3)

    // ---------------- Era rewards checks -----------------------
    // Check that total validator rewards for era 1 are non-zero
    const validatorBalancePre = (await api.query.system.account(validatorAccount)).data.free
    const totalValidatorRewardsEra1 = await api.query.staking.erasValidatorReward(1)
    assert(totalValidatorRewardsEra1.unwrap().gtn(0), 'rewards for era 1 are zero!')
    // Check that the new validator claim for era 1 is non-zero
    const claimingValidatorPayoutFixture = new ClaimingPayoutStakersSucceedsFixture(
      api,
      validatorAccount,
      validatorAccount,
      1
    )
    await new FixtureRunner(claimingValidatorPayoutFixture).run()
    const validatorBalancePost = (await api.query.system.account(validatorAccount)).data.free
    assert(validatorBalancePost.gt(validatorBalancePre), 'validator balance not increased after claiming era 1 payout')

    // ----------------- Validator set checks -----------------------
    // Babe authorities remain unchanged
    const babeAuthoritiesEra2 = await api.getBabeAuthorities()
    assert.deepEqual(babeAuthoritiesEra2, [validatorSessionKeys.babe.toString()])
  } finally {
    clearTimeout(testTimeout)
  }
}
