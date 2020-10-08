import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { Api, WorkingGroups } from '../../Api'
import { VoteForProposalFixture, WorkingGroupMintCapacityProposalFixture } from '../../fixtures/proposalsModule'
import { ExpectMintCapacityChangedFixture } from '../../fixtures/workingGroupModule'
import { ProposalId } from '@joystream/types/proposals'
import { DbService } from '../../DbService'

export default async function workingGroupMintCapactiy(
  api: Api,
  env: NodeJS.ProcessEnv,
  db: DbService,
  group: WorkingGroups
) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const mintCapacityIncrement: BN = new BN(env.MINT_CAPACITY_INCREMENT!)

  const m1KeyPairs = db.getMembers()
  const m2KeyPairs = db.getCouncil()

  const newMintCapacity: BN = (await api.getWorkingGroupMintCapacity(group)).add(mintCapacityIncrement)
  const workingGroupMintCapacityProposalFixture: WorkingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    api,
    m1KeyPairs,
    sudo,
    newMintCapacity,
    group
  )
  // Propose mint capacity
  await workingGroupMintCapacityProposalFixture.runner(false)

  const voteForProposalFixture: VoteForProposalFixture = new VoteForProposalFixture(
    api,
    m2KeyPairs,
    sudo,
    workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
  )
  const expectMintCapacityChanged = new ExpectMintCapacityChangedFixture(api, newMintCapacity)
  // Approve mint capacity
  voteForProposalFixture.runner(false)
  await expectMintCapacityChanged.runner(false)
}
