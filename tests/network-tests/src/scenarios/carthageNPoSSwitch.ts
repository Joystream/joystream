import changingAuthorities from 'src/flows/carthage/changingAuthorities'
import claimingPayoutsEnabled from 'src/flows/carthage/claimingPayoutEnabled'
import setForceNewEra from 'src/flows/carthage/setForceNewEra'
import currentEraIsSomeInPoS from 'src/flows/carthage/currentEraIsSomeInPoS'
import { scenario } from '../Scenario'

scenario('Carthage NPoS switch', async ({ job }) => {
  job('set force era to force new', setForceNewEra)
  job('current era is none', currentEraIsSomeInPoS)
  job('authority set is changing', changingAuthorities)
  job('claiming payout disabled in PoA', claimingPayoutsEnabled)
})
