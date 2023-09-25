import { scenario } from '../Scenario'
import postRuntimeUpdateChecks from '../misc/postRuntimeUpdateChecks'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Full', async ({ job, env, debug }) => {
  // Runtime checks
  job('Run Post Upgrade Checks', postRuntimeUpdateChecks)
})
