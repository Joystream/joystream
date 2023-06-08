import { scenario } from '../Scenario'
import buyingMemberships from '../flows/membership/buyingMemberships'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Orion', async ({ job }) => {
  job('buying memberships', buyingMemberships)
})
