import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import { SetBudgetFixture } from '../../fixtures/workingGroups/SetBudgetFixture'
import { SpendBudgetFixture } from '../../fixtures/workingGroups/SpendBudgetFixture'

export default async function groupBudget({ api, query }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const budgets: BN[] = [new BN(1000000)]

      const debug = Debugger(`flow:group-budget:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const setGroupBudgetFixture = new SetBudgetFixture(api, query, group, budgets)
      await new FixtureRunner(setGroupBudgetFixture).runWithQueryNodeChecks()

      const recievers = (await api.createKeyPairs(5)).map((kp) => kp.address)
      const amounts = recievers.map((reciever, i) => new BN(10000 * (i + 1)))
      const spendGroupBudgetFixture = new SpendBudgetFixture(api, query, group, recievers, amounts)
      await new FixtureRunner(spendGroupBudgetFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
