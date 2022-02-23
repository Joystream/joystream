import leadOpening from '../flows/working-groups/leadOpening'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import initStorage, { singleBucketConfig as storageConfig } from '../flows/storage/initStorage'
import { workingGroups } from '../consts'
import { scenario } from '../Scenario'

scenario('Content directory', async ({ job }) => {
  /* TODO: uncomment this after buy-now issue is fixed
  const leadSetupJob = job('Set WorkingGroup Leads', leadOpening)

  // TOOD: topup content and storage leaders
  // const [, storageLeader] = await api.getLeader('storageWorkingGroup')
  // const storageLeaderKey = storageLeader.role_account_id.toString()
  // await api.treasuryTransferBalance(storageLeaderKey, new BN(100_000)),

  const initStorageJob = job('initialize storage system', initStorage(storageConfig)).requires(leadSetupJob)

  const videoCountersJob = job('check active video counters', activeVideoCounters).requires(initStorageJob)
  job('nft auction and offers', nftAuctionAndOffers).after(videoCountersJob)
  */

  job('nft auction and offers', nftAuctionAndOffers)
})
