import leadOpening from '../flows/working-groups/leadOpening'
import openingsAndApplications from '../flows/working-groups/openingsAndApplications'
import upcomingOpenings from '../flows/working-groups/upcomingOpenings'
import groupStatus from '../flows/working-groups/groupStatus'
import workerActions from '../flows/working-groups/workerActions'
import { scenario } from '../Scenario'
import groupBudget from '../flows/working-groups/groupBudget'
import terminateLeads from '../flows/working-groups/terminateLeads'
import electCouncil from '../flows/council/elect'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Working groups', async ({ job }) => {
  const councilJob = job('electing council', electCouncil)
  const hireLeads = job('hire leads', leadOpening()).after(councilJob)
  job('terminate working-group leads', terminateLeads)
    .requires(job('openings and applications', openingsAndApplications).requires(hireLeads))
    .requires(job('upcoming openings', upcomingOpenings).requires(hireLeads))
    .requires(job('group status', groupStatus).requires(hireLeads))
    .requires(job('worker actions', workerActions).requires(hireLeads))
    .requires(job('group budget', groupBudget).requires(hireLeads))
})
