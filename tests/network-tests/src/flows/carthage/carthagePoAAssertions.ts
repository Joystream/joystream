import { assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
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
  const pastAuthorities = await api.getBabeAuthorities()

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

  // -------------------------- ACT -------------------------------

  // wait SessionPerEra * Epoch length blocks (standard era duration in block)
  // this is the calculation done by the runtime:
  // see https://github.com/paritytech/substrate/blob/master/frame/staking/src/pallet/impls.rs#L938
  const period = api.consts.babe.epochDuration.toBn()
  const sessionsPerEra = api.consts.staking.sessionsPerEra.toBn()
  let currentBlock = (await api.getCurrentBlockNumber()).toBn()
  const lastEraBlock = period.mul(sessionsPerEra).add(currentBlock)
  while (currentBlock < lastEraBlock) {
    sleep(sleepTimeSeconds * 1000)
    currentBlock = (await api.getCurrentBlockNumber()).toBn()
  }

  // -------------------------- ASSERT ----------------------------

  // 0. Force none state at genesis
  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone)

  // 1. Authorities are constant
  // 1.a. babe authorities are constant
  const currentAuthorities = await api.getBabeAuthorities()
  assert.deepEqual(pastAuthorities, currentAuthorities, 'babe authorities have changed')

  // 1.b. Queued keys (for next session) and current session keys are the same
  const sessionAuthorities = await api.getSessionAuthorities()
  const queuedKeys = await api.getQueuedKeys()
  assert.deepEqual(queuedKeys, sessionAuthorities, 'different validator keys in between sessions ')

  // 2. Next Era starting session index is none
  const activeEraIndex = (await api.getActiveEra()).unwrap().index.toNumber()
  const nextEraIndex = activeEraIndex + 1
  const nextEraStartSessionIndex = await api.getErasStartSessionIndex(nextEraIndex)
  assert.equal(activeEraIndex, 0)
  assert(nextEraStartSessionIndex.isNone, 'next era doomed to begin')

  // 3. Elections
  // 3.a election round is blocked
  const electionRoundSnapshot = await api.getElectionSnapshot()
  assert(electionRoundSnapshot.isNone, 'ongoing elections')

  // 3.b election round is 1 (initial round)
  const currentElectionRound = (await api.getElectionRounds()).toNumber()
  assert.equal(currentElectionRound, 1, 'election rounds happened')
}
