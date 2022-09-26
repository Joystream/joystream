import authoritiesDontGetTips from 'src/flows/carthage/authoritiesDontGetTips'
import authoritiesDoGetTips from 'src/flows/carthage/authoritiesDoGetTips'
import bondingSucceedsInPoA from 'src/flows/carthage/bondingSucceedsInPoA'
import changingAuthorities from 'src/flows/carthage/changingAuthorities'
import claimingPayoutsDisabled from 'src/flows/carthage/claimingPayoutsDisabled'
import forceEraIsNone from 'src/flows/carthage/forceEraIsNone'
import nominateSucceedsInPoA from 'src/flows/carthage/nominateSucceedsInPoA'
import validateSucceedsInPoA from 'src/flows/carthage/validateSucceedsInPoA'
import constantAuthorities from '../flows/carthage/constantAuthorities'
import { scenario } from '../Scenario'
import forceEraIsForceNew from 'src/flows/carthage/forceEraForceNew'
import claimingPayoutsEnabled from 'src/flows/carthage/claimingPayoutEnabled'
import setForceNewEra from 'src/flows/carthage/setForceNewEra'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Carthage PoA setup', async ({ job }) => {
  job('authority set is constant', constantAuthorities)
  job('authorities do not get tips', authoritiesDontGetTips)
  job('current era is none', forceEraIsNone)
  job('nominate succeeds in PoA', nominateSucceedsInPoA)
  job('validate succeeds in PoA', validateSucceedsInPoA)
  job('bonding succeeds in PoA', bondingSucceedsInPoA)
  job('claiming payout disabled in PoA', claimingPayoutsDisabled)
})

scenario('Carthage NPoS switch', async ({ job }) => {
  job('set force era to force new', setForceNewEra)
  job('current era is none', forceEraIsForceNew)
  job('authority set is changing', changingAuthorities)
  job('authorities do not get tips', authoritiesDoGetTips)
  job('claiming payout disabled in PoA', claimingPayoutsEnabled)
})
