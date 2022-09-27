import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { assert } from 'chai'
import BN from 'bn.js'
import { BondingSucceedsFixture } from 'src/fixtures/staking/BondingSucceedsFixture'
import { ValidatingSucceedsFixture } from 'src/fixtures/staking/ValidatingSucceedsFixture'
import { NominatingSucceedsFixture } from 'src/fixtures/staking/NominatingSucceedsFixture'

export default async function nominateSucceedsInPoA({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: nominate succeeds in PoA')
  debug('started')
  api.enableDebugTxLogs()

  const bondAmount = new BN(100000)

  // we are in poa
  const currentEra = await api.getCurrentEra()
  assert(currentEra.isNone)

  // create keys and bonding tx
  const [nominatorAccount, validatorAccount] = (await api.createKeyPairs(2)).map(({ key }) => key.address)

  // bond nominator account
  const nominatorBondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: nominatorAccount,
    controller: nominatorAccount,
    bondAmount: bondAmount,
  })
  const nominatorFixture = new FixtureRunner(nominatorBondingSucceedsFixture)
  await nominatorFixture.run()

  // bond validator account
  const validatorBondingSucceedsFixture = new BondingSucceedsFixture(api, {
    stash: validatorAccount,
    controller: validatorAccount,
    bondAmount: bondAmount,
  })
  const validatorFixture = new FixtureRunner(validatorBondingSucceedsFixture)
  await validatorFixture.run()

  // candidate validator
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

  // attempt to nominate
  const nominatorCandidatingSucceedsFixture = new NominatingSucceedsFixture(api, [validatorAccount], nominatorAccount)
  const nominationFixture = new FixtureRunner(nominatorCandidatingSucceedsFixture)
  await nominationFixture.run()
}
