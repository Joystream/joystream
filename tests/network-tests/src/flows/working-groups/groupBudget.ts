import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import { SpendBudgetFixture } from '../../fixtures/workingGroups/SpendBudgetFixture'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

export default async function groupBudget({ api, query }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const budget = new BN(1000000)

      const debug = extendDebug(`flow:group-budget:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const [funderAcc] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [funderAcc])
      await new FixtureRunner(buyMembershipFixture).run()
      const [funderMemberId] = buyMembershipFixture.getCreatedMembers()
      await api.fundWorkingGroupBudget(group, funderMemberId, budget)

      const recievers = (await api.createKeyPairs(5)).map(({ key }) => key.address)
      const amounts = recievers.map((reciever, i) => new BN(10000 * (i + 1)))
      const spendGroupBudgetFixture = new SpendBudgetFixture(api, query, group, recievers, amounts)
      await new FixtureRunner(spendGroupBudgetFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
