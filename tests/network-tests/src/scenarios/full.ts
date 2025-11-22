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
import exactExecutionBlock from '../flows/proposals/exactExecutionBlock'
import expireProposal from '../flows/proposals/expireProposal'
import proposalsDiscussion from '../flows/proposalsDiscussion'
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
import { createAppActions } from '../flows/content/createAppActions'
import { createApp } from '../flows/content/createApp'
import { updateApp } from '../flows/content/updateApp'
import curatorModerationActions from '../flows/content/curatorModerationActions'
import collaboratorAndCuratorPermissions from '../flows/content/collaboratorAndCuratorPermissions'
import updateValidatorVerificationStatus from '../flows/membership/updateValidatorVerifications'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Full', async ({ job }) => {
  const coreJob = job('electing council', electCouncil)

  // All other jobs should be executed after coreJob

  // Membership:
  job('buying members', buyingMemberships).after(coreJob)
  job('updating member profile', updatingMemberProfile).after(coreJob)
  job('updating member accounts', updatingMemberAccounts).after(coreJob)
  job('transferring invites', transferringInvites).after(coreJob)
  job('inviting members', invitingMembers).after(coreJob)
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
  const hireLeads = job('lead opening', leadOpening(true)).after(channelPayoutsProposalJob)
  job('openings and applications', openingsAndApplications).requires(hireLeads)
  job('upcoming openings', upcomingOpenings).requires(hireLeads)
  job('group status', groupStatus).requires(hireLeads)
  job('worker actions', workerActions).requires(hireLeads)
  job('group budget', groupBudget).requires(hireLeads)

  // Memberships (depending on hired leads)
  job('updating member verification status', updatingVerificationStatus).after(hireLeads)
  job('updating validator verification status', updateValidatorVerificationStatus).after(hireLeads)

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
  const curatorModerationActionsJob = job('curator moderation actions', curatorModerationActions).after(
    commentsAndReactionsJob
  )
  const collaboratorAndCuratorPermissionsJob = job(
    'curators and collaborators permissions',
    collaboratorAndCuratorPermissions
  ).after(curatorModerationActionsJob)
  job('direct channel payment by members', directChannelPayment).after(collaboratorAndCuratorPermissionsJob)

  // Apps
  job('create app', createApp).after(hireLeads)
  job('update app', updateApp).after(hireLeads)
  job('create app actions', createAppActions).after(hireLeads)
})
