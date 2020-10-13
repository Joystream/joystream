import BN from 'bn.js'
import { Api } from '../../Api'
import { ValidatorCountProposalFixture } from '../../fixtures/proposalsModule'
import { DbService } from '../../DbService'
import { assert } from 'chai'

export default async function validatorCount(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
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
  await validatorCountProposalFixture.runner(false)
}
