import { expect, assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import BN from 'bn.js'
import { BondingSucceedsFixture } from '../../fixtures/staking/BondingSucceedsFixture'
import { ValidatingSucceedsFixture } from '../../fixtures/staking/ValidatingSucceedsFixture'
import { NominatingSucceedsFixture } from '../../fixtures/staking/NominatingSucceedsFixture'

export default async function carthagePoAAssertions({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: constant Authorities in PoA')
  debug('started')
  api.enableDebugTxLogs()

  const bondAmount = new BN(1000000000000000)
  const [nominatorAccount, validatorAccount] = (await api.createKeyPairs(2)).map(({ key }) => key.address)
  const forceEra = await api.getForceEra()
  assert(forceEra.isForceNone)

  // 1. Authorities are constant
  // 1.a. babe authorities are constant
  const currentAuthorities = await api.getBabeAuthorities()
  const nextAuthorities = await api.getNextBabeAuthorities()
  expect(nextAuthorities).to.be.deep.equal(currentAuthorities)

  // 1.b. Next session keys are none
  const sessionAuthorities = await api.getSessionAuthorities()
  const queuedKeys = await api.getQueuedKeys()
  expect(queuedKeys).to.be.deep.equal(sessionAuthorities)

  // 2. Next Era starting session index is none
  const activeEra = await api.getActiveEra()
  if (activeEra.isSome) {
    const { index } = activeEra.unwrap()
    const nextEraIndex = index.addn(1)
    const nextSessionIndex = await api.getErasStartSessionIndex(nextEraIndex as u32)
    assert.equal(index.toNumber(), 0)
    assert(nextSessionIndex.isNone)
  }

  // 3. Bonding succeds
  // 3.a. bond nominator account
  const nominatorBondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: nominatorAccount,
    controller: nominatorAccount,
    bondAmount: bondAmount,
  })
  const nominatorFixture = new FixtureRunner(nominatorBondingSucceedsFixture)
  await nominatorFixture.run()

  // 3.b. bond validator account
  const validatorBondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: validatorAccount,
    controller: validatorAccount,
    bondAmount: bondAmount,
  })
  const validatorFixture = new FixtureRunner(validatorBondingSucceedsFixture)
  await validatorFixture.run()

  // 4. Validating succeeds: candidate validator
  const validatorCandidatingSucceedsFixture = new ValidatingSucceedsFixture(
    api,
    {
      'commission': 10,
      'blocked': false,
    },
    validatorAccount
  )
  const candidationFixture = new FixtureRunner(validatorCandidatingSucceedsFixture)
  await candidationFixture.run()

  // 5. Nominating succeds:
  const nominatorCandidatingSucceedsFixture = new NominatingSucceedsFixture(api, [validatorAccount], nominatorAccount)
  const nominationFixture = new FixtureRunner(nominatorCandidatingSucceedsFixture)
  await nominationFixture.run()
}
