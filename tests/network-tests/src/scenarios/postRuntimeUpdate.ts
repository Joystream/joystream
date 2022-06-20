import { scenario } from '../Scenario'
import postRuntimeUpdateChecks from '../misc/postRuntimUpdateChecks'

scenario('Post Runtime Upgrade', async ({ job }) => {
  // Verify constants
  job('Run Checks', postRuntimeUpdateChecks)
})
