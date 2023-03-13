import BN from 'bn.js'
import { Resource } from '../../Resources'
import { workingGroupNameByModuleName, workingGroups } from '../../consts'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import { CreateProposalsFixture, DecideOnProposalStatusFixture } from '../../fixtures/proposals'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { createType } from '@joystream/types'

export default async function terminateLeads({ api, query, lock }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = extendDebug(`flow:terminate-leads:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      // Terminate lead
      const leadId = await api.getLeaderId(group)
      const [roleAccount] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [roleAccount])
      await new FixtureRunner(buyMembershipFixture).run()
      const [memberId] = buyMembershipFixture.getCreatedMembers()

      const unlock = await lock(Resource.Proposals)

      const createTerminateLeadProposalFixture = new CreateProposalsFixture(api, query, [
        {
          type: 'TerminateWorkingGroupLead',
          details: createType('PalletProposalsCodexTerminateRoleParameters', {
            'workerId': leadId,
            'slashingAmount': new BN(0),
            'group': workingGroupNameByModuleName[group],
          }),
          asMember: memberId,
          title: 'Proposal to Hired lead',
          description: `Proposal to hire lead ${group}`,
        },
      ])
      await new FixtureRunner(createTerminateLeadProposalFixture).run()
      const [proposalId] = createTerminateLeadProposalFixture.getCreatedProposalsIds()

      // COUNCIL approves and the proosal gets executed
      const decideOnLeadOpeningProposalStatusFixture = new DecideOnProposalStatusFixture(api, query, [
        { proposalId, status: 'Approved', expectExecutionFailure: false },
      ])
      await new FixtureRunner(decideOnLeadOpeningProposalStatusFixture).runWithQueryNodeChecks()
      // const terminateLeadFixture = new TerminateWorkersFixture(api, query, group, [leadId], [new BN(0)])
      // await new FixtureRunner(terminateLeadFixture).runWithQueryNodeChecks()
      unlock()

      await debug('Done')
    })
  )
}
