import leadOpening from '../flows/working-groups/leadOpening'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import initStorage, { singleBucketConfig as storageConfig } from '../flows/storage/initStorage'
import { scenario } from '../Scenario'

scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job('Set WorkingGroup Leads', leadOpening())

  const initStorageJob = job('initialize storage system', initStorage(storageConfig)).requires(leadSetupJob)

  const videoCountersJob = job('check active video counters', activeVideoCounters).requires(initStorageJob)
  job('nft auction and offers', nftAuctionAndOffers).after(videoCountersJob)
})
