import { scenario } from '../Scenario'
import carthagePoAAssertions from '../flows/carthage/carthagePoAAssertions'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Carthage PoA setup', async ({ job }) => {
  job('carthage poa assertions', carthagePoAAssertions)
})
