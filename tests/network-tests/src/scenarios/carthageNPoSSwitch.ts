// import changingAuthorities from 'src/flows/carthage/changingAuthorities'
// import claimingPayoutsEnabled from 'src/flows/carthage/claimingPayoutEnabled'
// import setForceNewEra from 'src/flows/carthage/setForceNewEra'
// import currentEraIsSomeInPoS from 'src/flows/carthage/currentEraIsSomeInPoS'
import { scenario } from '../Scenario'
import switchToNPoS from '../flows/carthage/switchToNPoS'
import carthagePoAAssertions from '../flows/carthage/carthagePoAAssertions'

scenario('Carthage NPoS switch', async ({ job }) => {
  const poaAssertions = job('carthage poa assertions', carthagePoAAssertions)
  job('switch to npos checks', switchToNPoS).requires(poaAssertions)
})
