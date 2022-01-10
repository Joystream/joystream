import leaderSetup from '../flows/workingGroup/leaderSetup'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const setupContentLeaderSetup = job('setup content lead', leaderSetup.content)
  const setupStorageLeaderSetup = job('setup storage lead', leaderSetup.storage)

  job('check active video counters', activeVideoCounters)
    .requires(setupContentLeaderSetup)
    .requires(setupStorageLeaderSetup)
})
