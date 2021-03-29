import { WorkingGroups } from '../../Api'
import { FlowProps } from '../../Flow'
import { AddWorkerOpeningFixture } from '../../fixtures/workingGroupModule'
import BN from 'bn.js'
import { assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'

// Zero at least value bug scenario
export default async function zeroAtLeastValueBug({ api, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:atLeastValueBug')
  debug('Started')
  api.enableDebugTxLogs()

  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(0)

  // Pre-conditions
  // A hired lead
  const lead = await api.getGroupLead(WorkingGroups.StorageWorkingGroup)
  assert.notEqual(lead, undefined)

  const addWorkerOpeningWithoutStakeFixture = new AddWorkerOpeningFixture(
    api,
    new BN(0),
    new BN(0),
    openingActivationDelay,
    unstakingPeriod,
    WorkingGroups.StorageWorkingGroup
  )

  // Add worker opening with 0 stake, expect failure!
  await new FixtureRunner(addWorkerOpeningWithoutStakeFixture).run()

  assert.equal(
    addWorkerOpeningWithoutStakeFixture.getCreatedOpeningId(),
    undefined,
    'Adding Worker Opening Should have failed'
  )

  const addWorkerOpeningWithoutUnstakingPeriodFixture = new AddWorkerOpeningFixture(
    api,
    applicationStake,
    roleStake,
    openingActivationDelay,
    new BN(0),
    WorkingGroups.StorageWorkingGroup
  )

  // Add worker opening with 0 unstaking period, expect failure!
  await new FixtureRunner(addWorkerOpeningWithoutUnstakingPeriodFixture).run()

  assert.equal(
    addWorkerOpeningWithoutUnstakingPeriodFixture.getCreatedOpeningId(),
    undefined,
    'Adding Worker Opening Should have failed'
  )

  // TODO: close openings
  debug('Passed')
}
