import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { getWorkingGroupNameByModuleName, workingGroups } from '../../consts'
import { SpendBudgetFixture } from '../../fixtures/workingGroups/SpendBudgetFixture'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { Resource } from '../../Resources'
import { CreateProposalsFixture, DecideOnProposalStatusFixture } from '../../fixtures/proposals'
import { createType } from '@joystream/types'

export default async function groupBudget({ api, query, lock }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const budget = new BN(1000000)

      const debug = extendDebug(`flow:group-budget:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const [roleAccount] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [roleAccount])
      await new FixtureRunner(buyMembershipFixture).run()
      const [memberId] = buyMembershipFixture.getCreatedMembers()

      const unlock = await lock(Resource.Proposals)
      const updateWgBudgetProposalFixture = new CreateProposalsFixture(api, query, [
        {
          type: 'UpdateWorkingGroupBudget',
          details: createType('(u128, PalletCommonWorkingGroupIterableEnumsWorkingGroup, PalletCommonBalanceKind)', [
            budget,
            getWorkingGroupNameByModuleName(group),
            createType('PalletCommonBalanceKind', 'Positive'),
          ]),
          asMember: memberId,
          title: 'Proposal to set budget',
          description: `Proposal to set budget for ${group}`,
        },
      ])
      await new FixtureRunner(updateWgBudgetProposalFixture).run()
      const [updateWgBudgetProposalId] = updateWgBudgetProposalFixture.getCreatedProposalsIds()
      const decideOnUpdateWgBudgetProposalStatusFixture = new DecideOnProposalStatusFixture(api, query, [
        { proposalId: updateWgBudgetProposalId, status: 'Approved', expectExecutionFailure: false },
      ])
      await new FixtureRunner(decideOnUpdateWgBudgetProposalStatusFixture).run()
      unlock()
      // const setGroupBudgetFixture = new SetBudgetFixture(api, query, group, budgets)
      // await new FixtureRunner(setGroupBudgetFixture).runWithQueryNodeChecks()

      const recievers = (await api.createKeyPairs(5)).map(({ key }) => key.address)
      const amounts = recievers.map((reciever, i) => new BN(10000 * (i + 1)))
      const spendGroupBudgetFixture = new SpendBudgetFixture(api, query, group, recievers, amounts)
      await new FixtureRunner(spendGroupBudgetFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
