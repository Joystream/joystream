import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { Utils } from '../../utils/utils'
import { VoteForProposalFixture, WorkingGroupMintCapacityProposalFixture } from '../../fixtures/proposalsModule'
import { ExpectMintCapacityChangedFixture } from '../../fixtures/workingGroupModule'
import { PaidTermId } from '@joystream/types/members'
import { ProposalId } from '@joystream/types/proposals'
import { CouncilElectionHappyCaseFixture } from '../../fixtures/councilElectionHappyCase'
import { DbService } from '../../services/dbService'

export default async function workingGroupMintCapactiy(apiWrapper: ApiWrapper, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.MEMBERSHIP_CREATION_N!
  let m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  let m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const mintCapacityIncrement: BN = new BN(env.MINT_CAPACITY_INCREMENT!)

  // const durationInBlocks = 30
  // setTestTimeout(apiWrapper, durationInBlocks)

  if (db.hasCouncil()) {
    m1KeyPairs = db.getMembers()
    m2KeyPairs = db.getCouncil()
  } else {
    const councilElectionHappyCaseFixture = new CouncilElectionHappyCaseFixture(
      apiWrapper,
      sudo,
      m1KeyPairs,
      m2KeyPairs,
      paidTerms,
      K,
      greaterStake,
      lesserStake
    )
    await councilElectionHappyCaseFixture.runner(false)
  }

  const newMintCapacity: BN = (await apiWrapper.getWorkingGroupMintCapacity(WorkingGroups.StorageWorkingGroup)).add(
    mintCapacityIncrement
  )
  const workingGroupMintCapacityProposalFixture: WorkingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    newMintCapacity,
    WorkingGroups.StorageWorkingGroup
  )
  // Propose mint capacity
  await workingGroupMintCapacityProposalFixture.runner(false)

  const voteForProposalFixture: VoteForProposalFixture = new VoteForProposalFixture(
    apiWrapper,
    m2KeyPairs,
    sudo,
    workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
  )
  const expectMintCapacityChanged = new ExpectMintCapacityChangedFixture(apiWrapper, newMintCapacity)
  // Approve mint capacity
  voteForProposalFixture.runner(false)
  await expectMintCapacityChanged.runner(false)
}
