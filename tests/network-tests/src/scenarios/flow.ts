import { scenario } from '../Scenario'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Single Flow', async ({ job }) => {
  const pathToFlow = path.join('../flows', process.argv[2])

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const flows = require(pathToFlow)

  const flow = flows.default || flows

  job('single-flow', flow)
})
