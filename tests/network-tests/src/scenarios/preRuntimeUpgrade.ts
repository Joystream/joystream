import { scenario } from '../Scenario'
import pre from '../misc/preRuntimeUpgrade'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Full', async ({ job, env, debug }) => {
  job('Pre-Upgrade setup and checks', pre)
})
