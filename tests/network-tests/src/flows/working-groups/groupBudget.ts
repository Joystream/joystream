import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import {
  SpendBudgetFixture,
  FundWorkingGroupBudgetFixture,
  VestedSpendFromBudgetFixture,
} from '../../fixtures/workingGroups'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { Resource } from '../../Resources'

const ONE_JOY = new BN(10 ** 10)

export default async function groupBudget({ api, query, lock }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = extendDebug(`flow:group-budget:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const funderAccounts = (await api.createKeyPairs(3)).map(({ key }) => key.address)
      await Promise.all(funderAccounts.map((address) => api.treasuryTransferBalance(address, ONE_JOY.muln(1000))))
      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, funderAccounts)
      await new FixtureRunner(buyMembershipFixture).run()
      const funderMembers = buyMembershipFixture.getCreatedMembers()

      // The vested amount of the vestedSpendFromBudget call has to be high enough for the call to succeed.
      // Otherwise it fails with "Dispatch Error: AmountLow" (I'm not sure what the minimum value is).
      const fundWorkingGroupBudgetFixture = new FundWorkingGroupBudgetFixture(api, query, group, [
        { memberId: funderMembers[0], amount: ONE_JOY.muln(200) },
        { memberId: funderMembers[1], amount: ONE_JOY.muln(300) },
        { memberId: funderMembers[2], amount: ONE_JOY.muln(500) },
      ])
      await new FixtureRunner(fundWorkingGroupBudgetFixture).runWithQueryNodeChecks()

      const receivers = (await api.createKeyPairs(5)).map(({ key }) => key.address)
      const amounts = receivers.map((_, i) => new BN(10_000 * (i + 1)))
      let unlockMembershipBudget
      if (group === 'membershipWorkingGroup') {
        unlockMembershipBudget = await lock(Resource.MembershipWgBudget)
      }
      const spendGroupBudgetFixture = new SpendBudgetFixture(api, query, group, receivers, amounts)
      await new FixtureRunner(spendGroupBudgetFixture).runWithQueryNodeChecks()

      const vestingAmount = ONE_JOY.muln(900)
      const vestingSchedule = {
        locked: vestingAmount,
        startingBlock: 10_000,
        perBlock: vestingAmount.divn(10),
      }
      const vestedSpendGroupBudgetFixture = new VestedSpendFromBudgetFixture(api, query, group, receivers.slice(0, 1), [
        vestingSchedule,
      ])
      await new FixtureRunner(vestedSpendGroupBudgetFixture).runWithQueryNodeChecks()

      if (unlockMembershipBudget !== undefined) {
        unlockMembershipBudget()
      }

      debug('Done')
    })
  )
}
