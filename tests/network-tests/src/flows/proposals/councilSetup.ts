import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { Api } from '../../Api'
import { CouncilElectionHappyCaseFixture } from '../../fixtures/councilElectionHappyCase'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import Debugger from 'debug'
import { assert } from 'chai'

const debug = Debugger('flow:councilSetup')

// Electing council scenario
export default async function councilSetup(api: Api, env: NodeJS.ProcessEnv) {
  // Skip creating council if already elected
  if ((await api.getCouncil()).length) {
    debug('Skipping Council Setup, Council already elected')
    return
  }

  const numberOfApplicants = (await api.getCouncilSize()).toNumber() * 2
  const voters = api.createKeyPairs(5).map((key) => key.address)
  const applicants = api.createKeyPairs(numberOfApplicants).map((key) => key.address)

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+env.COUNCIL_STAKE_LESSER_AMOUNT!)

  const createMembersFixture = new BuyMembershipHappyCaseFixture(api, [...voters, ...applicants], paidTerms)
  await createMembersFixture.runner(false)

  // The fixture moves manually with sudo the election stages, so proper processing
  // that normally occurs during stage transitions does not happen. This can lead to a council
  // that is smaller than the council size if not enough members apply.
  const councilElectionHappyCaseFixture = new CouncilElectionHappyCaseFixture(
    api,
    voters,
    applicants,
    K,
    greaterStake,
    lesserStake
  )

  await councilElectionHappyCaseFixture.runner(false)

  // Elected council
  assert((await api.getCouncil()).length)
}
