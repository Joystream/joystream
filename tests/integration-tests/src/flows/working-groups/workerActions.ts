import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import { HireWorkersFixture } from '../../fixtures/workingGroups/HireWorkersFixture'
import { UpdateWorkerRoleAccountsFixture } from '../../fixtures/workingGroups/UpdateWorkerRoleAccountsFixture'
import { IncreaseWorkerStakesFixture } from '../../fixtures/workingGroups/IncreaseWorkerStakesFixture'
import { UpdateWorkerRewardAccountsFixture } from '../../fixtures/workingGroups/UpdateWorkerRewardAccountsFixture'
import { Worker } from '@joystream/types/working-group'
import { LeaveRoleFixture } from '../../fixtures/workingGroups/LeaveRoleFixture'
import { assert } from 'chai'
import BN from 'bn.js'
import { UpdateWorkerRewardAmountsFixture } from '../../fixtures/workingGroups/UpdateWorkerRewardAmountsFixture'
import { DecreaseWorkerStakesFixture } from '../../fixtures/workingGroups/DecreaseWorkerStakesFixture'
import { SlashWorkerStakesFixture } from '../../fixtures/workingGroups/SlashWorkerStakesFixture'
import { TerminateWorkersFixture } from '../../fixtures/workingGroups/TerminateWorkersFixture'

export default async function workerActions({ api, query, env }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = Debugger(`flow:worker-actions:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const WORKERS_N = parseInt(env.WORKER_ACTIONS_WORKERS_N || '')
      const TERMINATIONS_N = parseInt(env.WORKER_ACTIONS_TERMINATE_N || '')
      assert.isAtLeast(WORKERS_N, 2)
      assert.isAtLeast(TERMINATIONS_N, 1)
      assert.isBelow(TERMINATIONS_N, WORKERS_N)

      const hireWorkersFixture = new HireWorkersFixture(api, query, group, WORKERS_N)
      await new FixtureRunner(hireWorkersFixture).run()
      const workerIds = hireWorkersFixture.getCreatedWorkerIds()
      const workers = await api.query[group].workerById.multi<Worker>(workerIds)

      // Independent updates that don't interfere with each other
      const workerUpdatesRunners: FixtureRunner[] = []

      const newRoleAccounts = (await api.createKeyPairs(WORKERS_N)).map((kp) => kp.address)
      const updateRoleAccountsFixture = new UpdateWorkerRoleAccountsFixture(
        api,
        query,
        group,
        workerIds,
        newRoleAccounts
      )
      const updateRoleAccountsRunner = new FixtureRunner(updateRoleAccountsFixture)
      await updateRoleAccountsRunner.run()
      workerUpdatesRunners.push(updateRoleAccountsRunner)

      const newRewardAccounts = (await api.createKeyPairs(WORKERS_N)).map((kp) => kp.address)
      const updateRewardAccountsFixture = new UpdateWorkerRewardAccountsFixture(
        api,
        query,
        group,
        workerIds,
        newRewardAccounts
      )
      const updateRewardAccountsRunner = new FixtureRunner(updateRewardAccountsFixture)
      await updateRewardAccountsRunner.run()
      workerUpdatesRunners.push(updateRewardAccountsRunner)

      const stakeIncreases = workerIds.map((id) => id.addn(1).muln(1000))
      // Transfer balances
      await Promise.all(
        stakeIncreases.map((amount, i) => api.treasuryTransferBalance(workers[i].staking_account_id.toString(), amount))
      )
      const increaseWorkerStakesFixture = new IncreaseWorkerStakesFixture(api, query, group, workerIds, stakeIncreases)
      const increaseWorkerStakesRunner = new FixtureRunner(increaseWorkerStakesFixture)
      await increaseWorkerStakesRunner.run()
      workerUpdatesRunners.push(increaseWorkerStakesRunner)

      const newRewards: (BN | null)[] = workerIds.map((id) => id.addn(1).muln(10))
      // At least one case should be null
      newRewards[0] = null
      const updateRewardsFixture = new UpdateWorkerRewardAmountsFixture(api, query, group, workerIds, newRewards)
      const updateRewardsRunner = new FixtureRunner(updateRewardsFixture)
      await updateRewardsRunner.run()
      workerUpdatesRunners.push(updateRewardsRunner)

      // Run query node checks for all above fixtures
      await Promise.all(workerUpdatesRunners.map((r) => r.runQueryNodeChecks()))

      // Those updates are separated since they affect worker stake and could interfere with each other:

      // Stake decreases
      const decreaseAmounts = workerIds.map((id) => id.addn(1).muln(100))
      const decreaseStakesFixture = new DecreaseWorkerStakesFixture(api, query, group, workerIds, decreaseAmounts)
      const decreaseStakesRunner = new FixtureRunner(decreaseStakesFixture)
      await decreaseStakesRunner.runWithQueryNodeChecks()

      // Termination / leaving runners
      const exitRunners: FixtureRunner[] = []
      const terminatedWorkerIds = workerIds.slice(0, TERMINATIONS_N)
      const leavingWorkerIds = workerIds.slice(TERMINATIONS_N)

      // Worker terminations
      const penaltyAmounts = workerIds.map((id) => id.addn(1).muln(200))
      const terminateWorkersFixture = new TerminateWorkersFixture(
        api,
        query,
        group,
        terminatedWorkerIds,
        penaltyAmounts
      )
      const terminateWorkersRunner = new FixtureRunner(terminateWorkersFixture)
      exitRunners.push(terminateWorkersRunner)

      // Workers leaving
      const leaveRoleFixture = new LeaveRoleFixture(api, query, group, leavingWorkerIds)
      const leaveRoleRunner = new FixtureRunner(leaveRoleFixture)
      exitRunners.push(leaveRoleRunner)

      await Promise.all(exitRunners.map((r) => r.runWithQueryNodeChecks()))

      // Slashes (post-leave-role to make sure they still work while worker is unstaking)
      const slashAmounts = leavingWorkerIds.map((id) => id.addn(1).muln(300))
      // Add at least 1 case where slashAmount > stake
      slashAmounts[0] = slashAmounts[0].muln(10)
      const slashStakesFixture = new SlashWorkerStakesFixture(api, query, group, leavingWorkerIds, slashAmounts)
      const slashStakesRunner = new FixtureRunner(slashStakesFixture)
      await slashStakesRunner.runWithQueryNodeChecks()

      await debug('Done')
    })
  )
}
