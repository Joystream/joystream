import { scenario } from '../../Scenario'
import { FlowProps } from '../../Flow'
import { Resource } from '../../Resources'

async function flow1({ lock }: FlowProps) {
  await lock(Resource.Council)
}

scenario(async ({ job }) => {
  job('test', [flow1, flow1])
})
