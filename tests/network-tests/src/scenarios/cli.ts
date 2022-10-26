import channelsAndVideos from '../flows/clis/createAndUpdateChannel'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Cli', async ({ job }) => {
  job('Manage channels and videos through CLI', channelsAndVideos)
})
