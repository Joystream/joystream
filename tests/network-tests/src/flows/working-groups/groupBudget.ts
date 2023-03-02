import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import { SpendBudgetFixture, FundWorkingGroupBudgetFixture } from '../../fixtures/workingGroups'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { Resource } from '../../Resources'

export default async function groupBudget({ api, query, lock }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = extendDebug(`flow:group-budget:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const funderAccounts = (await api.createKeyPairs(3)).map(({ key }) => key.address)
      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, funderAccounts)
      await new FixtureRunner(buyMembershipFixture).run()
      const funderMembers = buyMembershipFixture.getCreatedMembers()

      const fundWorkingGroupBudgetFixture = new FundWorkingGroupBudgetFixture(api, query, group, [
        { memberId: funderMembers[0], amount: new BN(110_000) },
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
