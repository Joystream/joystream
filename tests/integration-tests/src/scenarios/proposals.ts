import proposals from '../flows/proposals'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('proposals', proposals)
})
