import BN from 'bn.js'
import { workingGroups } from '../../consts'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { TerminateWorkersFixture } from '../../fixtures/workingGroups/TerminateWorkersFixture'
import { FlowProps } from '../../Flow'

export default async function terminateLeads({ api, query }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = extendDebug(`flow:terminate-leads:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      // Terminate lead
      const leadId = await api.getLeaderId(group)
      const terminateLeadFixture = new TerminateWorkersFixture(api, query, group, [leadId], [new BN(0)], true)
      await new FixtureRunner(terminateLeadFixture).runWithQueryNodeChecks()

      await debug('Done')
    })
  )
}
