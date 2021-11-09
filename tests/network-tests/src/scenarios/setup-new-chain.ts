import councilSetup from '../flows/council/setup'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import mockContentFlow from '../giza/mockContentFlow'

import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const council = job('Create Council', councilSetup)

  const leads = job('Setup WorkingGroup Leads', [leaderSetup.storage, leaderSetup.content])

  // Create some mock content in content directory - without assets or any real metadata
  const mockContent = job('Create Mock Content', mockContentFlow).after(leads)
})
