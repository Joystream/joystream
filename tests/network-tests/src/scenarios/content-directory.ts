import leadOpening from '../flows/working-groups/leadOpening'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import commentsAndReactions from '../flows/content/commentsAndReactions'
import videoCategories from '../flows/content/videoCategories'
import { scenario } from '../Scenario'
import curatorModerationActions from '../flows/content/curatorModerationActions'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job('Set content working group leads', leadOpening(true, ['contentWorkingGroup']))

  // following jobs must be run sequentially due to some QN queries that could interfere
  const videoCategoriesJob = job('video categories', videoCategories).requires(leadSetupJob)
  const videoCountersJob = job('check active video counters', activeVideoCounters).requires(videoCategoriesJob)
  const nftAuctionAndOffersJob = job('nft auction and offers', nftAuctionAndOffers).after(videoCountersJob)
  const curatorModerationActionsJob = job('curator moderation actions', curatorModerationActions).after(nftAuctionAndOffersJob)
  job('video comments and reactions', commentsAndReactions).after(curatorModerationActionsJob)
})
