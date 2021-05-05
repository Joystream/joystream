import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { FlowProps } from '../../Flow'
import { ElectCouncilFixture } from '../../fixtures/councilElectionModule'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { Resource } from '../../Resources'

export default async function councilSetup({ api, env, lock }: FlowProps): Promise<void> {
  const label = 'councilSetup'
  const debug = extendDebug(`flow:${label}`)

  debug('Started')

  await lock(Resource.Council)

  // Skip creating council if already elected
  if ((await api.getCouncil()).length) {
    return debug('Skipping council setup. A Council is already elected')
  }

  debug('Electing new council')

  const numberOfApplicants = (await api.getCouncilSize()).toNumber() * 2
  const applicants = api.createKeyPairs(numberOfApplicants).map((key) => key.address)
  const voters = api.createKeyPairs(5).map((key) => key.address)

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+env.COUNCIL_STAKE_LESSER_AMOUNT!)

  // Todo pass the label to the fixture to make debug logs of fixture associated with flow name
  const createMembersFixture = new BuyMembershipHappyCaseFixture(api, [...voters, ...applicants], paidTerms)
  await new FixtureRunner(createMembersFixture).run()

  // The fixture uses sudo to transition through the election stages, so proper processing
  // that normally occurs during stage transitions does not happen. This can lead to a council
  // that is smaller than the target council size if not enough members apply.
  const electCouncilFixture = new ElectCouncilFixture(
    api,
    voters, // should be member ids
    applicants, // should be member ids
    K,
    greaterStake,
    lesserStake
  )

  await new FixtureRunner(electCouncilFixture).run()

  debug('Done')
}
