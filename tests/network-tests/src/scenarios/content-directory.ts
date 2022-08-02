import addAndUpdateVideoSubtitles from '../flows/content/videoSubtitles'
import createAndUpdateChannel from '../flows/clis/createAndUpdateChannel'
import commentsAndReactions from '../flows/content/commentsAndReactions'
import curatorModerationActions from '../flows/content/curatorModerationActions'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import leadOpening from '../flows/working-groups/leadOpening'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job('Set content working group leads', leadOpening(true, ['contentWorkingGroup']))
  const channelJob = job('Create and Update Channel with assets', createAndUpdateChannel).requires(leadSetupJob)
  job('Add and Update Video Subtitles', addAndUpdateVideoSubtitles).requires(channelJob)
  job('nft auction and offers', nftAuctionAndOffers).requires(channelJob)
  job('curator moderation actions', curatorModerationActions).requires(channelJob)
  job('video comments and reactions', commentsAndReactions).after(channelJob)
})
