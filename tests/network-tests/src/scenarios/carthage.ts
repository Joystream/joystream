import validatorSet from '../flows/carthage/validatorSet'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Carthage', async ({ job }) => {
  job('validator set is constant', validatorSet)
})
