import bondingSucceedsInPoA from 'src/flows/carthage/bondingSucceedsInPoA'
import claimingPayoutsDisabled from 'src/flows/carthage/claimingPayoutsDisabled'
import nominateSucceedsInPoA from 'src/flows/carthage/nominateSucceedsInPoA'
import validateSucceedsInPoA from 'src/flows/carthage/validateSucceedsInPoA'
import constantAuthorities from '../flows/carthage/constantAuthorities'
import { scenario } from '../Scenario'
import currentEraIsNoneInPoA from 'src/flows/carthage/currentEraIsNoneInPoA'
import authoritiesDoGetTips from 'src/flows/carthage/authoritiesDoGetTips'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Carthage PoA setup', async ({ job }) => {
  job('authority set is constant', constantAuthorities)
  job('current era is none', currentEraIsNoneInPoA)
  job('authorities do get tips', authoritiesDoGetTips)
  job('nominate succeeds in PoA', nominateSucceedsInPoA)
  job('validate succeeds in PoA', validateSucceedsInPoA)
  job('bonding succeeds in PoA', bondingSucceedsInPoA)
  job('claiming payout disabled in PoA', claimingPayoutsDisabled)
})
