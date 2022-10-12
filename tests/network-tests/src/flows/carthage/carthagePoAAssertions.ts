import { assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import { u32 } from '@polkadot/types'
import { BN } from 'bn.js'
import { PalletStakingValidatorPrefs } from '@polkadot/types/lookup'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { ValidatingSucceedsFixture } from '../../fixtures/staking/ValidatingSucceedsFixture'
import { NominatingSucceedsFixture } from '../../fixtures/staking/NominatingSucceedsFixture'

export default async function carthagePoAAssertions({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: constant Authorities in PoA')
  debug('started')
  api.enableDebugTxLogs()

  // ----------------------- ARRANGE -----------------------------
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const sleepTimeSeconds = 10
  const nominatorBond = await api.query.staking.minNominatorBond()
  const validatorBond = await api.query.staking.minValidatorBond()
  const [nominatorAccount, validatorAccount] = (await api.createKeyPairs(2)).map(({ key }) => key.address)
  const forceEra = await api.getForceEra()
  const pastAuthorities = await api.getBabeAuthorities()
  assert(forceEra.isForceNone)

  // -------------------------- ACT -------------------------------

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

  // -------------------------- ASSERT ----------------------------

  // 1. Authorities are constant
  // 1.a. babe authorities are constant
  const currentAuthorities = await api.getBabeAuthorities()
  assert.deepEqual(pastAuthorities, currentAuthorities, 'babe authorities have changed')

  // 1.b. Queued keys (for next session) and current session keys are the same
  const sessionAuthorities = await api.getSessionAuthorities()
  const queuedKeys = await api.getQueuedKeys()
  assert.deepEqual(queuedKeys, sessionAuthorities, 'different validator keys in between sessions ')

  // 2. Next Era starting session index is none
  const activeEra = await api.getActiveEra()
  if (activeEra.isSome) {
    const { index } = activeEra.unwrap()
    const nextEraIndex = index.addn(1)
    const nextEraStartSessionIndex = await api.getErasStartSessionIndex(nextEraIndex as u32)
    assert.equal(index.toNumber(), 0)
    assert(nextEraStartSessionIndex.isNone, 'next era doomed to begin')
  }

  // 3. Elections
  // 3.a election round is blocked
  const electionRoundSnapshot = await api.getElectionSnapshot()
  assert(electionRoundSnapshot.isNone, 'ongoing elections')

  // 3.b election round is 1 (initial round)
  const currentElectionRound = (await api.getElectionRounds()).toNumber()
  assert.equal(currentElectionRound, 1, 'election rounds happened')
}
