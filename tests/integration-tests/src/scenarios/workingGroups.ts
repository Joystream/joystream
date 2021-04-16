import leadOpening from '../flows/working-groups/leadOpening'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('sudo lead opening', leadOpening)
})
