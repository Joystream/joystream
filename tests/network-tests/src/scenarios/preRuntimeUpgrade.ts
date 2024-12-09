import { scenario } from '../Scenario'
import pre from '../misc/preRuntimeUpgrade'
import leadOpening from '../flows/working-groups/leadOpening'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Pre-RuntimeUpgrade', async ({ job }) => {
  job('Pre-Upgrade setup and checks', pre).after(job('Hire content lead', leadOpening(true, ['contentWorkingGroup'])))
})
