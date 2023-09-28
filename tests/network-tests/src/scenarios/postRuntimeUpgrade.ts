import { scenario } from '../Scenario'
import post from '../misc/postRuntimeUpgrade'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Post-RuntimeUpgrade', async ({ job }) => {
  // Runtime checks
  job('Post-Upgrade Checks', post)
})
