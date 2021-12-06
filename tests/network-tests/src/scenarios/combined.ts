import creatingMemberships from '../flows/membership/creatingMemberships'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import atLeastValueBug from '../flows/workingGroup/atLeastValueBug'
import { manageWorkerFlow } from '../flows/workingGroup/manageWorkerAsLead'
import manageWorkerAsWorker from '../flows/workingGroup/manageWorkerAsWorker'
import workerPayout from '../flows/workingGroup/workerPayout'
import initDistributionBucket from '../flows/clis/initDistributionBucket'
import initStorageBucket from '../flows/clis/initStorageBucket'
import createChannel from '../flows/clis/createChannel'
import { scenario } from '../Scenario'
import { WorkingGroups } from '../WorkingGroups'

scenario(async ({ job }) => {
  // These tests assume:
  // - storage setup (including hired lead)
  // - existing council
  job('creating members', creatingMemberships)

  const leadSetupJob = job('setup leads', [
    leaderSetup(WorkingGroups.Storage, true),
    leaderSetup(WorkingGroups.Content, true),
    leaderSetup(WorkingGroups.Distribution, true),
  ])

  // Test bug only on one instance of working group is sufficient
  job('at least value bug', atLeastValueBug).requires(leadSetupJob)

  // tests minting payouts (requires council to set mint capacity)
  job('worker payouts', [workerPayout.storage, workerPayout.content, workerPayout.distribution]).requires(leadSetupJob)

  job('working group tests', [
    manageWorkerFlow(WorkingGroups.Storage),
    manageWorkerAsWorker.storage,
    manageWorkerFlow(WorkingGroups.Content),
    manageWorkerAsWorker.content,
    manageWorkerFlow(WorkingGroups.Distribution),
    manageWorkerAsWorker.distribution,
  ]).requires(leadSetupJob)

  const initBuckets = job('init storage and distribution buckets via CLI', [
    initDistributionBucket,
    initStorageBucket,
  ]).requires(leadSetupJob)
  job('create channel via CLI', createChannel).requires(initBuckets)
})
