import createChannel from '../flows/clis/createAndUpdateChannel'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Cli', async ({ job }) => {
  job('create channel via CLI', createChannel)
})
