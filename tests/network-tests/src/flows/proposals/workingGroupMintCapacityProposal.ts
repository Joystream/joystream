import BN from 'bn.js'
import { Api, WorkingGroups } from '../../Api'
import { VoteForProposalFixture, WorkingGroupMintCapacityProposalFixture } from '../../fixtures/proposalsModule'
import { ExpectMintCapacityChangedFixture } from '../../fixtures/workingGroupModule'
import { ProposalId } from '@joystream/types/proposals'
import { assert } from 'chai'

export default async function workingGroupMintCapactiy(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups) {
  const mintCapacityIncrement: BN = new BN(env.MINT_CAPACITY_INCREMENT!)

  // Pre-conditions: members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()
  const newMintCapacity: BN = (await api.getWorkingGroupMintCapacity(group)).add(mintCapacityIncrement)
  const workingGroupMintCapacityProposalFixture: WorkingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    api,
    proposer,
    newMintCapacity,
    group
  )
  // Propose mint capacity
  await workingGroupMintCapacityProposalFixture.runner(false)

  const voteForProposalFixture: VoteForProposalFixture = new VoteForProposalFixture(
    api,
    workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
  )
  const expectMintCapacityChanged = new ExpectMintCapacityChangedFixture(api, newMintCapacity)
  // Approve mint capacity
  voteForProposalFixture.runner(false)
  await expectMintCapacityChanged.runner(false)
}
