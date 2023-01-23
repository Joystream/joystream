import categories from '../flows/forum/categories'
import threads from '../flows/forum/threads'
import posts from '../flows/forum/posts'
import moderation from '../flows/forum/moderation'
import threadTags from '../flows/forum/threadTags'
import leadOpening from '../flows/working-groups/leadOpening'
import buyingMemberships from '../flows/membership/buyingMemberships'
import creatingMembers from '../flows/membership/creatingMembers'
import creatingFoundingMembers from '../flows/membership/creatingFoundingMembers'
import updatingMemberProfile from '../flows/membership/updatingProfile'
import updatingMemberAccounts from '../flows/membership/updatingAccounts'
import invitingMebers from '../flows/membership/invitingMembers'
import transferringInvites from '../flows/membership/transferringInvites'
import managingStakingAccounts from '../flows/membership/managingStakingAccounts'
import openingsAndApplications from '../flows/working-groups/openingsAndApplications'
import upcomingOpenings from '../flows/working-groups/upcomingOpenings'
import groupStatus from '../flows/working-groups/groupStatus'
import workerActions from '../flows/working-groups/workerActions'
import groupBudget from '../flows/working-groups/groupBudget'
import proposals from '../flows/proposals'
import cancellingProposals from '../flows/proposals/cancellingProposal'
import vetoProposal from '../flows/proposals/vetoProposal'
import electCouncil from '../flows/council/elect'
import failToElect from '../flows/council/failToElect'
import runtimeUpgradeProposal from '../flows/proposals/runtimeUpgradeProposal'
import exactExecutionBlock from '../flows/proposals/exactExecutionBlock'
import expireProposal from '../flows/proposals/expireProposal'
import proposalsDiscussion from '../flows/proposalsDiscussion'
import initDistributionBucket from '../flows/clis/initDistributionBucket'
import initStorageBucket from '../flows/clis/initStorageBucket'
import channelsAndVideos from '../flows/clis/channelsAndVideos'
import { scenario } from '../Scenario'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import nftAuctionAndOffers from '../flows/content/nftAuctionAndOffers'
import updatingVerificationStatus from '../flows/membership/updateVerificationStatus'
import commentsAndReactions from '../flows/content/commentsAndReactions'
import addAndUpdateVideoSubtitles from '../flows/content/videoSubtitles'
import { testVideoCategories } from '../flows/content/videoCategories'
import channelPayouts from '../flows/proposals/channelPayouts'
import { createApp, updateApp } from '../flows/content/app'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Full', async ({ job, env }) => {
  // Runtime upgrade should always be first job
  // (except councilJob, which is required for voting and should probably depend on the "source" runtime)
  const councilJob = job('electing council', electCouncil)
  const runtimeUpgradeProposalJob = env.RUNTIME_UPGRADE_TARGET_WASM_PATH
    ? job('runtime upgrade proposal', runtimeUpgradeProposal).requires(councilJob)
    : undefined

  const coreJob = runtimeUpgradeProposalJob || councilJob

  // All other jobs should be executed after coreJob

  // Membership:
  job('buying members', buyingMemberships).after(coreJob)
  job('creating members', creatingMembers).after(coreJob)
  job('creating founding members', creatingFoundingMembers).after(coreJob)
  job('updating member profile', updatingMemberProfile).after(coreJob)
  job('updating member accounts', updatingMemberAccounts).after(coreJob)
  job('inviting members', invitingMebers).after(coreJob)
  job('transferring invites', transferringInvites).after(coreJob)
  job('managing staking accounts', managingStakingAccounts).after(coreJob)

  // Council (should not interrupt proposalsJob!)
  const secondCouncilJob = job('electing second council', electCouncil).requires(coreJob)
  const councilFailuresJob = job('council election failures', failToElect).requires(secondCouncilJob)

  // Proposals:
  const proposalsJob = job('proposals & proposal discussion', [
    proposals,
    cancellingProposals,
    vetoProposal,
    exactExecutionBlock,
    expireProposal,
    proposalsDiscussion,
  ]).requires(councilFailuresJob)

  const channelPayoutsProposalJob = env.CHANNEL_PAYOUTS_VECTOR_FILE
    ? job('channel payouts proposal', channelPayouts).requires(proposalsJob)
    : undefined

  // Working groups
  const sudoHireLead = job('sudo lead opening', leadOpening(process.env.IGNORE_HIRED_LEADS === 'true')).after(
    channelPayoutsProposalJob || proposalsJob
  )
  job('openings and applications', openingsAndApplications).requires(sudoHireLead)
  job('upcoming openings', upcomingOpenings).requires(sudoHireLead)
  job('group status', groupStatus).requires(sudoHireLead)
  job('worker actions', workerActions).requires(sudoHireLead)
  job('group budget', groupBudget).requires(sudoHireLead)

  // Memberships (depending on hired lead)
  job('updating member verification status', updatingVerificationStatus).after(sudoHireLead)

  // Forum:
  job('forum categories', categories).requires(sudoHireLead)
  job('forum threads', threads).requires(sudoHireLead)
  job('forum thread tags', threadTags).requires(sudoHireLead)
  job('forum posts', posts).requires(sudoHireLead)
  job('forum moderation', moderation).requires(sudoHireLead)

  // Content directory
  // following jobs must be run sequentially due to some QN queries that could interfere
  const videoCategoriesJob = job('video categories', testVideoCategories).requires(sudoHireLead)
  const channelsAndVideosCliJob = job('manage channels and videos through CLI', channelsAndVideos).requires(
    videoCategoriesJob
  )
  job('add and update video subtitles', addAndUpdateVideoSubtitles).requires(channelsAndVideosCliJob)
  const videoCountersJob = job('check active video counters', activeVideoCounters).requires(channelsAndVideosCliJob)
  const nftAuctionAndOffersJob = job('nft auction and offers', nftAuctionAndOffers).after(videoCountersJob)
  const commentsAndReactionsJob = job('video comments and reactions', commentsAndReactions).after(
    nftAuctionAndOffersJob
  )
  job('create app', createApp).after(sudoHireLead)
  job('update app', updateApp).after(sudoHireLead)

  const contentDirectoryJob = commentsAndReactionsJob // keep updated to last job above

  // Storage & distribution CLIs
  job('init storage and distribution buckets via CLI', [initDistributionBucket, initStorageBucket]).after(
    contentDirectoryJob
  )
})
