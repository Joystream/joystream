import leadOpening from '../flows/working-groups/leadOpening'
import openingAndApplicationStatus from '../flows/working-groups/openingAndApplicationStatus'
import upcomingOpenings from '../flows/working-groups/upcomingOpenings'
import groupStatus from '../flows/working-groups/groupStatus'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const sudoHireLead = job('sudo lead opening', leadOpening)
  job('opening and application status', openingAndApplicationStatus).requires(sudoHireLead)
  job('upcoming openings', upcomingOpenings).requires(sudoHireLead)
  job('group status', groupStatus).requires(sudoHireLead)
})
