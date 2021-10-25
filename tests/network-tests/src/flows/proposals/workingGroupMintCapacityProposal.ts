import BN from 'bn.js'
import { Api, WorkingGroups } from '../../Api'
import { FlowProps } from '../../Flow'
import {
  VoteForProposalAndExpectExecutionFixture,
  WorkingGroupMintCapacityProposalFixture,
} from '../../fixtures/proposalsModule'
import { ProposalId } from '@joystream/types/proposals'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'
import { Resource, ResourceLocker } from '../../Resources'

export default {
  storage: async function ({ api, env, lock }: FlowProps): Promise<void> {
    return workingGroupMintCapactiy(api, env, WorkingGroups.StorageWorkingGroup, lock)
  },

  content: async function ({ api, env, lock }: FlowProps): Promise<void> {
    return workingGroupMintCapactiy(api, env, WorkingGroups.ContentWorkingGroup, lock)
  },
  distribution: async function ({ api, env, lock }: FlowProps): Promise<void> {
    return workingGroupMintCapactiy(api, env, WorkingGroups.DistributionWorkingGroup, lock)
  },
}

async function workingGroupMintCapactiy(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups, lock: ResourceLocker) {
  const debug = extendDebug(`flow:workingGroupMintCapacityProposal:${group}`)
  debug('Started')
  await lock(Resource.Proposals)

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
  await new FixtureRunner(workingGroupMintCapacityProposalFixture).run()

  const voteForProposalFixture = new VoteForProposalAndExpectExecutionFixture(
    api,
    workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
  )

  // Approve mint capacity
  await new FixtureRunner(voteForProposalFixture).run()

  debug('Done')
}
