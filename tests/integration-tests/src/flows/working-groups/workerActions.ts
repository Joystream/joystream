import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import { Utils } from '../../utils'
import { HireWorkersFixture } from '../../fixtures/workingGroups/HireWorkersFixture'
import { UpdateWorkerRoleAccountsFixture } from '../../fixtures/workingGroups/UpdateWorkerRoleAccountsFixture'
import { IncreaseWorkerStakesFixture } from '../../fixtures/workingGroups/IncreaseWorkerStakesFixture'
import { UpdateWorkerRewardAccountsFixture } from '../../fixtures/workingGroups/UpdateWorkerRewardAccountsFixture'
import { Worker } from '@joystream/types/working-group'

export default async function workerActions({ api, query, env }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = Debugger(`flow:worker-actions:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const N = parseInt(env.WORKER_ACTIONS_WORKERS_N || '')
      Utils.assert(N > 0, 'Invalid WORKER_ACTIONS_WORKERS_N env value')

      const hireWorkersFixture = new HireWorkersFixture(api, query, group, N)
      await new FixtureRunner(hireWorkersFixture).run()
      const workerIds = hireWorkersFixture.getCreatedWorkerIds()
      const workers = await api.query[group].workerById.multi<Worker>(workerIds)

      const runners: FixtureRunner[] = []

      const newRoleAccounts = (await api.createKeyPairs(N)).map((kp) => kp.address)
      const updateRoleAccountsFixture = new UpdateWorkerRoleAccountsFixture(
        api,
        query,
        group,
        workerIds,
        newRoleAccounts
      )
      const updateRoleAccountsRunner = new FixtureRunner(updateRoleAccountsFixture)
      await updateRoleAccountsRunner.run()
      runners.push(updateRoleAccountsRunner)

      const newRewardAccounts = (await api.createKeyPairs(N)).map((kp) => kp.address)
      const updateRewardAccountsFixture = new UpdateWorkerRewardAccountsFixture(
        api,
        query,
        group,
        workerIds,
        newRewardAccounts
      )
      const updateRewardAccountsRunner = new FixtureRunner(updateRewardAccountsFixture)
      await updateRewardAccountsRunner.run()
      runners.push(updateRewardAccountsRunner)

      const stakeIncreases = workerIds.map((id) => id.muln(1000))
      // Transfer balances
      await Promise.all(
        stakeIncreases.map((amount, i) => api.treasuryTransferBalance(workers[i].staking_account_id.toString(), amount))
      )
      const increaseWorkerStakesFixture = new IncreaseWorkerStakesFixture(api, query, group, workerIds, stakeIncreases)
      const increaseWorkerStakesRunner = new FixtureRunner(increaseWorkerStakesFixture)
      await increaseWorkerStakesRunner.run()
      runners.push(increaseWorkerStakesRunner)

      await Promise.all(runners.map((r) => r.runQueryNodeChecks()))

      await debug('Done')
    })
  )
}
