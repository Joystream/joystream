import { FlowProps } from '../../Flow'
import {
  ApplyOnOpeningHappyCaseFixture,
  CancelOpeningFixture,
  CreateOpeningFixture,
  WithdrawApplicationsFixture,
  LEADER_OPENING_STAKE,
} from '../../fixtures/workingGroupsModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { workingGroups } from '../../types'
import { assert } from 'chai'

export default async function openingAndApplicationStatusFlow({ api, query, env }: FlowProps): Promise<void> {
  const APPLICATION_CREATE_N = parseInt(env.APPLICATION_STATUS_CREATE_N || '')
  const APPLICATION_WITHDRAW_N = parseInt(env.APPLICATION_STATUS_WITHDRAW_N || '')
  assert.isAbove(APPLICATION_CREATE_N, 0)
  assert.isAbove(APPLICATION_WITHDRAW_N, 0)
  assert.isBelow(APPLICATION_WITHDRAW_N, APPLICATION_CREATE_N)

  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = Debugger(`flow:opening-and-application-status:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      // Transfer funds to leader staking acc to cover opening stake
      const leaderStakingAcc = await api.getLeaderStakingKey(group)
      await api.treasuryTransferBalance(leaderStakingAcc, LEADER_OPENING_STAKE)

      // Create an opening
      const sudoLeadOpeningFixture = new CreateOpeningFixture(api, query, group)
      const openingRunner = new FixtureRunner(sudoLeadOpeningFixture)
      await openingRunner.run()
      const openingId = sudoLeadOpeningFixture.getCreatedOpeningId()
      const openingParams = sudoLeadOpeningFixture.getDefaultOpeningParams()

      // Create some applications
      const applicantAccounts = (await api.createKeyPairs(APPLICATION_CREATE_N)).map((kp) => kp.address)
      const stakingAccounts = (await api.createKeyPairs(APPLICATION_CREATE_N)).map((kp) => kp.address)

      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, applicantAccounts)
      await new FixtureRunner(buyMembershipFixture).run()
      const applicantMemberIds = buyMembershipFixture.getCreatedMembers()

      const applicantContexts = applicantAccounts.map((account, i) => ({
        account,
        memberId: applicantMemberIds[i],
      }))

      await Promise.all(
        applicantContexts.map((applicantContext, i) => {
          const addStakingAccFixture = new AddStakingAccountsHappyCaseFixture(api, query, applicantContext, [
            stakingAccounts[i],
          ])
          return new FixtureRunner(addStakingAccFixture).run()
        })
      )
      await Promise.all(stakingAccounts.map((a) => api.treasuryTransferBalance(a, openingParams.stake)))
      const applicationIds = await Promise.all(
        applicantContexts.map(async (context, i) => {
          const applyOnOpeningFixture = new ApplyOnOpeningHappyCaseFixture(
            api,
            query,
            group,
            context,
            stakingAccounts[i],
            openingId,
            openingParams.metadata
          )
          const applicationRunner = new FixtureRunner(applyOnOpeningFixture)
          await applicationRunner.run()
          return applyOnOpeningFixture.getCreatedApplicationId()
        })
      )

      // Withdraw some applications
      const withdrawApplicationsFixture = new WithdrawApplicationsFixture(
        api,
        query,
        group,
        applicantAccounts.slice(0, APPLICATION_WITHDRAW_N),
        applicationIds.slice(0, APPLICATION_WITHDRAW_N)
      )
      const withdrawApplicationsRunner = new FixtureRunner(withdrawApplicationsFixture)
      await withdrawApplicationsRunner.run()

      // Cancel the opening
      const cancelOpeningFixture = new CancelOpeningFixture(api, query, group, openingId)
      const cancelOpeningRunner = new FixtureRunner(cancelOpeningFixture)
      await cancelOpeningRunner.run()

      // Run query node check
      await Promise.all([withdrawApplicationsRunner.runQueryNodeChecks(), cancelOpeningRunner.runQueryNodeChecks()])

      debug('Done')
    })
  )
}
