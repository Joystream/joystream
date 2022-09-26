import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { assert } from 'chai'
import { AccountId32 } from '@polkadot/types/interfaces'
import BN from 'bn.js'
import { BondingSucceedsFixture } from 'src/fixtures/staking/BondingSucceedsFixture'
import { ValidatingSucceedsFixture } from 'src/fixtures/staking/ValidatingSucceedsFixture'
import { NominatingSucceedsFixture } from 'src/fixtures/staking/NominatingSucceedsFixture'

export default async function validateSucceedsInPoA({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  const bondAmount = new BN(100000)

  // we are in poa
  assert(api.getCurrentEra().isNone)

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
  const validatorCandidatingSucceedsFixture = new ValidatingSucceedsFixture(api, {
    commission: 1,
    blocked: false,
  })
  const candidationFixture = new FixtureRunner(validatorCandidatingSucceedsFixture)
  await candidationFixture.run()

  // attempt to nominate
  const nominatorCandidatingSucceedsFixture = new NominatingSucceedsFixture(
    api,
    [validatorAccount as AccountId32],
    nominatorAccount
  )
  const nominationFixture = new FixtureRunner(nominatorCandidatingSucceedsFixture)
  await nominationFixture.run()
}
