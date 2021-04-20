import leadOpening from '../flows/working-groups/leadOpening'
import openingAndApplicationStatus from '../flows/working-groups/openingAndApplicationStatus'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const sudoHireLead = job('sudo lead opening', leadOpening)
  job('opening and application status', openingAndApplicationStatus).requires(sudoHireLead)
})
