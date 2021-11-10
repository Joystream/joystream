import councilSetup from '../flows/council/setup'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import mockContentFlow from '../giza/mockContentFlow'

import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const council = job('Create Council', councilSetup)

  const contentLead = job('Set Content Lead', leaderSetup.contentIfNotSet)

  // Create some mock content in content directory - without assets or any real metadata
  const mockContent = job('Create Mock Content', mockContentFlow).after(contentLead)

  const otherLeads = job('Set WorkingGroup Leads', [
    leaderSetup.storageIfNotSet,
    leaderSetup.distributionIfNotSet,
    leaderSetup.operationsAlphaIfNotSet,
    leaderSetup.operationsBetaIfNotSet,
    leaderSetup.operationsGammaIfNotSet,
  ])
})
