import { scenario } from '../../Scenario'
import { FlowProps } from '../../Flow'
import { Resource } from '../../Resources'

async function flow({ lock }: FlowProps) {
  await lock(Resource.Proposals)
}

scenario('Resource locks 2', async ({ job }) => {
  // Runtime is configured for MaxActiveProposalLimit = 5
  // So we should ensure we don't exceed that number of active proposals
  // which limits the number of concurrent tests that create proposals
  job('test', [flow, flow, flow, flow, flow, flow])
})
