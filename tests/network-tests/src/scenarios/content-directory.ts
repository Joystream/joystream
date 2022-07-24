import leadOpening from '../flows/working-groups/leadOpening'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import commentsAndReactions from '../flows/content/commentsAndReactions'
import { scenario } from '../Scenario'
import curatorModerationActions from '../flows/content/curatorModerationActions'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job(
    'Set content working group leads',
    leadOpening(true, ['contentWorkingGroup', 'storageWorkingGroup'])
  )
  job('nft auction and offers', nftAuctionAndOffers).requires(leadSetupJob)
  job('curator moderation actions', curatorModerationActions).requires(leadSetupJob)
  job('video comments and reactions', commentsAndReactions).after(leadSetupJob)
})
