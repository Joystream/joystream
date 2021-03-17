import creatingMemberships from '../flows/membership/creatingMemberships'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('creating members', creatingMemberships)
})
