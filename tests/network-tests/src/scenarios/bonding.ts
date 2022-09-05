import failToBond from '../flows/staking/failToBond'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Bonding', async ({ job }) => {
  job('failToBond', failToBond)
})
