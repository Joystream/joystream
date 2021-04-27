import leadOpening from '../flows/working-groups/leadOpening'
import openingAndApplicationStatus from '../flows/working-groups/openingAndApplicationStatus'
import upcomingOpenings from '../flows/working-groups/upcomingOpenings'
import groupStatus from '../flows/working-groups/groupStatus'
import workerActions from '../flows/working-groups/workerActions'
import { scenario } from '../Scenario'
import groupBudget from '../flows/working-groups/groupBudget'

scenario(async ({ job }) => {
  const sudoHireLead = job('sudo lead opening', leadOpening)
  job('opening and application status', openingAndApplicationStatus).requires(sudoHireLead)
  job('upcoming openings', upcomingOpenings).requires(sudoHireLead)
  job('group status', groupStatus).requires(sudoHireLead)
  job('worker actions', workerActions).requires(sudoHireLead)
  job('group budget', groupBudget).requires(sudoHireLead)
})
