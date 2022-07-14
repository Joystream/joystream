import leadOpening from '../flows/working-groups/leadOpening'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import commentsAndReactions from '../flows/content/commentsAndReactions'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job('Set content working group leads', leadOpening(true, ['contentWorkingGroup']))

  // following jobs must be run sequentially due to some QN queries that could interfere
  const videoCountersJob = job('check active video counters', activeVideoCounters).requires(leadSetupJob)
  const nftAuctionAndOffersJob = job('nft auction and offers', nftAuctionAndOffers).after(videoCountersJob)
  job('video comments and reactions', commentsAndReactions).after(nftAuctionAndOffersJob)
})
