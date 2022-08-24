import initFaucet from '../flows/faucet/initFaucet'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Setup Faucet', async ({ job }) => {
  job('Initialize Faucet', initFaucet)
})
