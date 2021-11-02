import councilSetup from '../flows/council/setup'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import mockContentFlow from '../sumer/mockContentFlow'

import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const council = job('Create Council', councilSetup)

  const leads = job('Setup WorkingGroup Leads', [leaderSetup.storage, leaderSetup.content])

  // After content lead is created create some mock content in content directory
  // Without uploading actual media
  const mockContent = job('Create Mock Content', mockContentFlow).after(leads)

  // Dump the account key ids that where generated in scenario so they can be re-derived at a later time
  job('Dump accounts', async ({ api }) => {
    const mappings = api.getAccountToKeyIdMappings()
    console.log(mappings)

    // TODO: get each account we are interested in knowing the keyid for..
    // const api = apiFactory.getApi('get interesting accounts')
    // Member accounts of council, lead, workers, and worker role accounts.
    // let accounts = api.getInterestingAccounts()
    // console.log(Api.addressesToKeyId.get(account))
  })
    .after(leads)
    .after(council)
    .after(mockContent)
})
