import { scenario } from '../Scenario'
import assertValues from '../misc/assertPostUpgradeConsts'

scenario('Post Runtime Upgrade', async ({ job }) => {
  // Verify constants
  job('Verify Values', assertValues)
})
