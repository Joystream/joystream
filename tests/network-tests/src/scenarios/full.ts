import categories from '../flows/forum/categories'
import threads from '../flows/forum/threads'
import posts from '../flows/forum/posts'
import moderation from '../flows/forum/moderation'
import threadTags from '../flows/forum/threadTags'
import leadOpening from '../flows/working-groups/leadOpening'
import buyingMemberships from '../flows/membership/buyingMemberships'
import updatingMemberProfile from '../flows/membership/updatingProfile'
import updatingMemberAccounts from '../flows/membership/updatingAccounts'
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
import directChannelPayment from '../flows/content/directChannelPayment'
import failToElectWithBlacklist from '../flows/council/electWithBlacklist'
import invitingMembers from '../flows/membership/invitingMembers'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Full', async ({ job, env }) => {
  // Runtime upgrade should always be first job
  // (except councilJob, which is required for voting and should probably depend on the "source" runtime)
  const councilJob = job('electing council', electCouncil)
  const runtimeUpgradeProposalJob = env.RUNTIME_UPGRADE_TARGET_WASM_PATH
    ? job('runtime upgrade proposal', runtimeUpgradeProposal).requires(councilJob)
    : undefined

  const coreJob = councilJob || runtimeUpgradeProposalJob

  // Membership:
  job('buying members', buyingMemberships).after(coreJob)
  job('updating member profile', updatingMemberProfile).after(coreJob)
  job('updating member accounts', updatingMemberAccounts).after(coreJob)
  job('transferring invites', transferringInvites).after(coreJob)
  job('managing staking accounts', managingStakingAccounts).after(coreJob)

  // Council (should not interrupt proposalsJob!)
  const secondCouncilJob = job('electing second council', electCouncil).requires(coreJob)
  const councilFailuresJob = job('council election failures', failToElect).requires(secondCouncilJob)
  job('council election failure with blacklist', failToElectWithBlacklist).requires(councilFailuresJob)

  // Proposals:
  const proposalsJob = job('proposals & proposal discussion', [
    proposals,
    cancellingProposals,
    vetoProposal,
    exactExecutionBlock,
    expireProposal,
    proposalsDiscussion,
  ]).requires(councilFailuresJob)

  const channelPayoutsProposalJob = job('channel payouts proposal', channelPayouts).requires(proposalsJob)

  // Working groups
  const hireLeads = job('lead opening', leadOpening(process.env.IGNORE_HIRED_LEADS === 'true')).after(
    channelPayoutsProposalJob
  )
  job('openings and applications', openingsAndApplications).requires(hireLeads)
  job('upcoming openings', upcomingOpenings).requires(hireLeads)
  job('group status', groupStatus).requires(hireLeads)
  job('worker actions', workerActions).requires(hireLeads)
  const groupBudgetSet = job('group budget', groupBudget).after(councilJob).requires(hireLeads)

  // Memberships (depending on hired lead, group budget set)
  job('updating member verification status', updatingVerificationStatus).after(hireLeads)
  job('inviting members', invitingMembers).requires(groupBudgetSet)

  // Forum:
  job('forum categories', categories).requires(hireLeads)
  job('forum threads', threads).requires(hireLeads)
  job('forum thread tags', threadTags).requires(hireLeads)
  job('forum posts', posts).requires(hireLeads)
  job('forum moderation', moderation).requires(hireLeads)

  // Content directory
  // following jobs must be run sequentially due to some QN queries that could interfere
  const videoCategoriesJob = job('video categories', testVideoCategories).requires(hireLeads)
  const channelsAndVideosCliJob = job('manage channels and videos through CLI', channelsAndVideos).requires(
    videoCategoriesJob
  )
  job('add and update video subtitles', addAndUpdateVideoSubtitles).requires(channelsAndVideosCliJob)
  const videoCountersJob = job('check active video counters', activeVideoCounters).requires(channelsAndVideosCliJob)
  const nftAuctionAndOffersJob = job('nft auction and offers', nftAuctionAndOffers).after(videoCountersJob)
  const commentsAndReactionsJob = job('video comments and reactions', commentsAndReactions).after(
    nftAuctionAndOffersJob
  )
  const directChannelPaymentJob = job('direct channel payment by members', directChannelPayment).after(
    commentsAndReactionsJob
  )

  const contentDirectoryJob = directChannelPaymentJob // keep updated to last job above

  // Storage & distribution CLIs
  job('init storage and distribution buckets via CLI', [initDistributionBucket, initStorageBucket]).after(
    contentDirectoryJob
  )
})
