import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import { SetBudgetFixture, SpendBudgetFixture, FundWorkingGroupBudgetFixture } from '../../fixtures/workingGroups'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

export default async function groupBudget({ api, query }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = extendDebug(`flow:group-budget:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const budgetsToSet: BN[] = [new BN(1_000_000), new BN(100_000)]
      const setGroupBudgetFixture = new SetBudgetFixture(api, query, group, budgetsToSet)
      await new FixtureRunner(setGroupBudgetFixture).runWithQueryNodeChecks()

      const funderAccounts = (await api.createKeyPairs(3)).map(({ key }) => key.address)
      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, funderAccounts)
      await new FixtureRunner(buyMembershipFixture).run()
      const funderMembers = buyMembershipFixture.getCreatedMembers()

      const fundWorkingGroupBudgetFixture = new FundWorkingGroupBudgetFixture(api, query, group, [
        { memberId: funderMembers[0], amount: new BN(10_000) },
        { memberId: funderMembers[1], amount: new BN(5_000) },
        { memberId: funderMembers[2], amount: new BN(35_000) },
      ])
      await new FixtureRunner(fundWorkingGroupBudgetFixture).runWithQueryNodeChecks()

      const recievers = (await api.createKeyPairs(5)).map(({ key }) => key.address)
      const amounts = recievers.map((reciever, i) => new BN(10000 * (i + 1)))
      const spendGroupBudgetFixture = new SpendBudgetFixture(api, query, group, recievers, amounts)
      await new FixtureRunner(spendGroupBudgetFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
