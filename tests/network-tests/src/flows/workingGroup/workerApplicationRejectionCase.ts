import { Api, WorkingGroups } from '../../Api'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { Utils } from '../../utils'
import {
  AcceptApplicationsFixture,
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  TerminateApplicationsFixture,
} from '../../fixtures/workingGroupModule'
import { OpeningId } from '@joystream/types/hiring'
import { DbService } from '../../DbService'
import { assert } from 'chai'

// Worker application rejection case scenario
export default async function workerApplicationRejection(
  api: Api,
  env: NodeJS.ProcessEnv,
  db: DbService,
  group: WorkingGroups
) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)
  const nonMemberKeyPairs = Utils.createKeyPairs(keyring, 2)

  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(100)

  assert(db.hasLeader(api.getWorkingGroupString(group)))
  const nKeyPairs = db.getMembers()
  leadKeyPair[0] = db.getLeader(api.getWorkingGroupString(group))

  const addWorkerOpeningFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    group
  )
  // Add worker opening
  await addWorkerOpeningFixture.runner(false)

  let applyForWorkerOpeningBeforeAcceptanceFixture: ApplyForOpeningFixture
  // Apply for worker opening, expect failure
  await (async () => {
    applyForWorkerOpeningBeforeAcceptanceFixture = new ApplyForOpeningFixture(
      api,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      group
    )
    await applyForWorkerOpeningBeforeAcceptanceFixture.runner(true)
  })()

  let acceptApplicationsFixture: AcceptApplicationsFixture
  // Begin accepting worker applications
  await (async () => {
    acceptApplicationsFixture = new AcceptApplicationsFixture(
      api,
      leadKeyPair[0],
      sudo,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      group
    )
    await acceptApplicationsFixture.runner(false)
  })()

  let applyForWorkerOpeningAsNonMemberFixture: ApplyForOpeningFixture
  // Apply for worker opening as non-member, expect failure
  await (async () => {
    applyForWorkerOpeningAsNonMemberFixture = new ApplyForOpeningFixture(
      api,
      nonMemberKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      group
    )
    await applyForWorkerOpeningAsNonMemberFixture.runner(true)
  })()

  let applyForWorkerOpeningFixture: ApplyForOpeningFixture
  // Apply for worker opening
  await (async () => {
    applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      api,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      group
    )
    await applyForWorkerOpeningFixture.runner(false)
  })()

  const terminateApplicationsFixture: TerminateApplicationsFixture = new TerminateApplicationsFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    group
  )
  // Terminate worker applicaitons
  await terminateApplicationsFixture.runner(false)
}
