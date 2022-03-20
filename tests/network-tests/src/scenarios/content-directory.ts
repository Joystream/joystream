import leadOpening from '../flows/working-groups/leadOpening'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import commentsAndReactions from '../flows/content/commentsAndReactions'
import { scenario } from '../Scenario'

scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job('Set content working group leads', leadOpening(true, ['contentWorkingGroup']))
  const videoCountersJob = job('check active video counters', activeVideoCounters).requires(leadSetupJob)
  job('nft auction and offers', nftAuctionAndOffers).after(videoCountersJob)
  job('add comments and reactions', commentsAndReactions).after(leadSetupJob)
})
