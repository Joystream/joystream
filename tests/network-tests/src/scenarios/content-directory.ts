import leadOpening from '../flows/working-groups/leadOpening'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import { scenario } from '../Scenario'

scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job('Set content working group leads', leadOpening(true, ['contentWorkingGroup']))
  // TODO: adjust test after https://github.com/Joystream/joystream/issues/3574 has been implemented
  // const videoCountersJob = job('check active video counters', activeVideoCounters).requires(leadSetupJob)
  job('nft auction and offers', nftAuctionAndOffers).requires(leadSetupJob)
})
