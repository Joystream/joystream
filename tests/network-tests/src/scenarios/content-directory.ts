import leaderSetup from '../flows/workingGroup/leaderSetup'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import { WorkingGroups } from '../WorkingGroups'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const setupContentLeaderSetup = job('setup content lead', leaderSetup(WorkingGroups.Content))
  const setupStorageLeaderSetup = job('setup storage lead', leaderSetup(WorkingGroups.Storage))

  job('check active video counters', activeVideoCounters)
    .requires(setupContentLeaderSetup)
    .requires(setupStorageLeaderSetup)
})
