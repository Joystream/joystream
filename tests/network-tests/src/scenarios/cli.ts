import channelsAndVideos from '../flows/clis/channelsAndVideos'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Cli', async ({ job }) => {
  job('manage channels and videos through CLI', channelsAndVideos)
})
