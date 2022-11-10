import { assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { ValidatingSucceedsFixture } from '../../fixtures/staking/ValidatingSucceedsFixture'
import { NominatingSucceedsFixture } from '../../fixtures/staking/NominatingSucceedsFixture'

export default async function carthagePoAAssertions({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: constant Authorities in PoA')
  debug('started')
  api.enableDebugTxLogs()

  // ----------------------- ARRANGE -----------------------------
  const currentTopValidatorStake = (await api.query.staking.erasStakers.entries(0))
    .map(([, v]) => v.total.toBn())
    .reduce((a, b) => (b.gt(a) ? b : a))
  const nominatorBond = await api.query.staking.minNominatorBond()
  // New validator's stake will be higher than any existing validator's total stake
  const validatorBond = currentTopValidatorStake.addn(1)
  const [nominatorAccount, validatorAccount] = (await api.createKeyPairs(2)).map(({ key }) => key.address)
  const pastAuthorities = await api.getBabeAuthorities()

  debug('setting up a new nominator and validator')
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

  // -------------------------- ACT -------------------------------
  let startedAtSession: number
  const numberOfSessionsToWait = api.consts.staking.sessionsPerEra.toNumber() * 2
  const slotsPerSession = api.consts.babe.epochDuration.toNumber()
  const slotDurationMs = api.consts.babe.expectedBlockTime.toNumber()
  const timeoutMs = numberOfSessionsToWait * slotsPerSession * slotDurationMs * 2

  // For each new session, make sure all assertions remain valid, until
  // current session index === startedAtSession + numberOfSessionsToWait
  await new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Timeout reached')), timeoutMs)
    const unsub = api.query.session.currentIndex(async (i) => {
      if (startedAtSession === undefined) {
        startedAtSession = i.toNumber()
      }
      debug(`current session: ${i.toNumber()} (last one to check: ${startedAtSession + numberOfSessionsToWait})...`)
      // 0. forceEra is still ForceNone
      const forceEra = await api.getForceEra()
      assert(forceEra.isForceNone)

      // 1. Current / Active Era is still `0`
      const activeEraIndex = (await api.getActiveEra()).unwrap().index.toNumber()
      const currentEraIndex = (await api.getCurrentEra()).unwrap().toNumber()
      assert.equal(activeEraIndex, 0, 'unexpected activeEra change')
      assert.equal(currentEraIndex, 0, 'unexpected currentEra change')

      // 2. Authorities are constant
      // 2.a. babe authorities are constant
      const currentAuthorities = await api.getBabeAuthorities()
      assert.deepEqual(pastAuthorities, currentAuthorities, 'babe authorities have changed')

      // 2.b. Queued keys (for next session) and current session keys are the same
      const sessionAuthorities = await api.getSessionAuthorities()
      const queuedKeys = await api.getQueuedKeys()
      assert.deepEqual(queuedKeys, sessionAuthorities, 'different validator keys in between sessions ')

      // 3. Next Era starting session index is none
      const nextEraIndex = activeEraIndex + 1
      const nextEraStartSessionIndex = await api.getErasStartSessionIndex(nextEraIndex)
      assert(nextEraStartSessionIndex.isNone, 'next era doomed to begin')

      // 4. Elections
      // 4.a election round is blocked
      const electionRoundSnapshot = await api.getElectionSnapshot()
      assert(electionRoundSnapshot.isNone, 'ongoing elections')

      // 4.b election round is 1 (initial round)
      const currentElectionRound = (await api.getElectionRounds()).toNumber()
      assert.equal(currentElectionRound, 1, 'election rounds happened')

      debug('All assertions OK!')
      if (i.toNumber() === startedAtSession + numberOfSessionsToWait) {
        ;(await unsub)()
        resolve(true)
      }
    })
  })
}
