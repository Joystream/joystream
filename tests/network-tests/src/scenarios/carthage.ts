import bondingSucceedsInPoA from 'src/flows/carthage/bondingSucceedsInPoA'
import changingAuthorities from 'src/flows/carthage/changingAuthorities'
import claimingPayoutsDisabled from 'src/flows/carthage/claimingPayoutsDisabled'
import nominateSucceedsInPoA from 'src/flows/carthage/nominateSucceedsInPoA'
import validateSucceedsInPoA from 'src/flows/carthage/validateSucceedsInPoA'
import currentEraIsNoneInPoA from 'src/flows/carthage/currentEraIsNoneInPoA'
import constantAuthorities from '../flows/carthage/constantAuthorities'
import { scenario } from '../Scenario'
import claimingPayoutsEnabled from 'src/flows/carthage/claimingPayoutEnabled'
import setForceNewEra from 'src/flows/carthage/setForceNewEra'
import currentEraIsSomeInPoS from 'src/flows/carthage/currentEraIsSomeInPoS'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Carthage PoA setup', async ({ job }) => {
  job('authority set is constant', constantAuthorities)
  job('current era is none', currentEraIsNoneInPoA)
  job('nominate succeeds in PoA', nominateSucceedsInPoA)
  job('validate succeeds in PoA', validateSucceedsInPoA)
  job('bonding succeeds in PoA', bondingSucceedsInPoA)
  job('claiming payout disabled in PoA', claimingPayoutsDisabled)
})

scenario('Carthage NPoS switch', async ({ job }) => {
  job('set force era to force new', setForceNewEra)
  job('current era is none', currentEraIsSomeInPoS)
  job('authority set is changing', changingAuthorities)
  job('claiming payout disabled in PoA', claimingPayoutsEnabled)
})
