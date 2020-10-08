import { Api, WorkingGroups } from '../../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import { AddWorkerOpeningFixture } from '../../fixtures/workingGroupModule'
import BN from 'bn.js'
import { Utils } from '../../utils'
import { DbService } from '../../DbService'
import { assert } from 'chai'
import Debugger from 'debug'
const debug = Debugger('flow:atLeastValueBug')

// Zero at least value bug scenario
export default async function zeroAtLeastValueBug(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  debug('Started')
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(0)

  // Pre-conditions
  // some members and a hired lead
  assert(db.hasLeader(WorkingGroups.StorageWorkingGroup))
  const nKeyPairs = db.getMembers()
  leadKeyPair[0] = db.getLeader(api.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))

  const addWorkerOpeningWithoutStakeFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    new BN(0),
    new BN(0),
    openingActivationDelay,
    unstakingPeriod,
    WorkingGroups.StorageWorkingGroup
  )
  // Add worker opening with 0 stake, expect failure
  await addWorkerOpeningWithoutStakeFixture.runner(true)

  const addWorkerOpeningWithoutUnstakingPeriodFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    new BN(0),
    WorkingGroups.StorageWorkingGroup
  )
  // Add worker opening with 0 unstaking period, expect failure
  await addWorkerOpeningWithoutUnstakingPeriodFixture.runner(true)

  // TODO: close openings
  debug('Completed')
}
