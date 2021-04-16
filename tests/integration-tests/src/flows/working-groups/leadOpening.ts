import { FlowProps } from '../../Flow'
import { ApplyOnOpeningHappyCaseFixture, SudoCreateLeadOpeningFixture } from '../../fixtures/workingGroupsModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'

export default async function leadOpening({ api, query, env }: FlowProps): Promise<void> {
  const debug = Debugger('flow:lead-opening')
  debug('Started')
  api.enableDebugTxLogs()

  const sudoLeadOpeningFixture = new SudoCreateLeadOpeningFixture(api, query, 'storageWorkingGroup')
  const openingRunner = new FixtureRunner(sudoLeadOpeningFixture)
  await openingRunner.run()
  const openingId = sudoLeadOpeningFixture.getCreatedOpeningId()
  const openingParams = sudoLeadOpeningFixture.getDefaultOpeningParams()

  const [applicantAcc, stakingAcc] = (await api.createKeyPairs(2)).map((kp) => kp.address)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [applicantAcc])
  await new FixtureRunner(buyMembershipFixture).run()
  const [applicantMemberId] = buyMembershipFixture.getCreatedMembers()

  const applicantContext = {
    account: applicantAcc,
    memberId: applicantMemberId,
  }

  const addStakingAccFixture = new AddStakingAccountsHappyCaseFixture(api, query, applicantContext, [stakingAcc])
  await new FixtureRunner(addStakingAccFixture).run()

  await api.treasuryTransferBalance(stakingAcc, openingParams.stake)

  const applyOnOpeningFixture = new ApplyOnOpeningHappyCaseFixture(
    api,
    query,
    'storageWorkingGroup',
    applicantContext,
    stakingAcc,
    openingId,
    openingParams.metadata
  )
  const applicationRunner = new FixtureRunner(applyOnOpeningFixture)
  await applicationRunner.run()

  // Run query node checks once the flow is done
  await openingRunner.runQueryNodeChecks()
  await applicationRunner.runQueryNodeChecks()

  debug('Done')
}
