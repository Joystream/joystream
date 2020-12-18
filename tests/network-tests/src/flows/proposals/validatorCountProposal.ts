import BN from 'bn.js'
import { Api } from '../../Api'
import { ValidatorCountProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'

export default async function validatorCount(api: Api, env: NodeJS.ProcessEnv) {
  // Pre-conditions: members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()

  const validatorCountIncrement: BN = new BN(+env.VALIDATOR_COUNT_INCREMENT!)

  const validatorCountProposalFixture: ValidatorCountProposalFixture = new ValidatorCountProposalFixture(
    api,
    proposer,
    validatorCountIncrement
  )
  await new FixtureRunner(validatorCountProposalFixture).run()
}
