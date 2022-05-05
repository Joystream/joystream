import { scenario } from '../Scenario'
import assertNftValues from '../flows/content/assertNftValues'

scenario('Post Runtime Upgrade', async ({ job }) => {
  job('Verify Nft Values', assertNftValues)
})
