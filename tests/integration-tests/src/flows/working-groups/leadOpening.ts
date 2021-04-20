import { FlowProps } from '../../Flow'
import {
  ApplyOnOpeningHappyCaseFixture,
  CreateOpeningFixture,
  SudoFillLeadOpeningFixture,
} from '../../fixtures/workingGroupsModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { workingGroups } from '../../types'

export default async function leadOpening({ api, query, env }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = Debugger(`flow:lead-opening:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const sudoLeadOpeningFixture = new CreateOpeningFixture(api, query, group, undefined, true)
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
        group,
        applicantContext,
        stakingAcc,
        openingId,
        openingParams.metadata
      )
      const applicationRunner = new FixtureRunner(applyOnOpeningFixture)
      await applicationRunner.run()
      const applicationId = applyOnOpeningFixture.getCreatedApplicationId()

      // Run query node checks once this part of the flow is done
      await Promise.all([openingRunner.runQueryNodeChecks(), applicationRunner.runQueryNodeChecks()])

      // Fill opening
      const fillOpeningFixture = new SudoFillLeadOpeningFixture(api, query, group, openingId, [applicationId])
      await new FixtureRunner(fillOpeningFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
