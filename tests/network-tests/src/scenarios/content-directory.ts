import addAndUpdateVideoSubtitles from '../flows/content/videoSubtitles'
import createAndUpdateChannel from '../flows/clis/createAndUpdateChannel'
import commentsAndReactions from '../flows/content/commentsAndReactions'
import { testVideoCategories } from '../flows/content/videoCategories'
import curatorModerationActions from '../flows/content/curatorModerationActions'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import collaboratorAndCuratorPermissions from '../flows/content/collaboratorAndCuratorPermissions'
import leadOpening from '../flows/working-groups/leadOpening'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job(
    'Set content working group leads',
    leadOpening(true, ['contentWorkingGroup', 'storageWorkingGroup'])
  )

  // following jobs must be run sequentially due to some QN queries that could interfere
  const channelJob = job('Create and Update Channel with assets', createAndUpdateChannel).requires(leadSetupJob)
  const videoCategoriesJob = job('video categories', testVideoCategories).after(channelJob)
  const subtitlesJob = job('Add and Update Video Subtitles', addAndUpdateVideoSubtitles).after(videoCategoriesJob)
  const videoCountersJob = job('check active video counters', activeVideoCounters).after(subtitlesJob)
  const nftAuctionAndOffersJob = job('nft auction and offers', nftAuctionAndOffers).after(videoCountersJob)
  const curatorModerationActionsJob = job('curator moderation actions', curatorModerationActions).after(
    nftAuctionAndOffersJob
  )
  const videoCommentsAndReactionsJob = job('video comments and reactions', commentsAndReactions).after(
    curatorModerationActionsJob
  )
  job('curators and collaborators permissions', collaboratorAndCuratorPermissions).after(videoCommentsAndReactionsJob)
})
