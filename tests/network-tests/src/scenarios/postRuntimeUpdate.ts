import { scenario } from '../Scenario'
import postRuntimeUpdateChecks from '../misc/postRuntimUpdateChecks'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Post Runtime Upgrade', async ({ job }) => {
  // Verify constants
  job('Run Checks', postRuntimeUpdateChecks)
})
