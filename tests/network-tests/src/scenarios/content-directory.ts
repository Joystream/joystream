import leaderSetup from '../flows/workingGroup/leaderSetup'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('setup content lead', leaderSetup.content)
})
