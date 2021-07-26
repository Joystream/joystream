// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Vec, u32, u64, u8 } from '@polkadot/types';
import type { MaxNumber, ProposalParameters } from './all';
import type { Balance, BalanceOf, BlockNumber, LockIdentifier, Moment, Perbill, RuntimeDbWeight, Weight } from '@polkadot/types/interfaces/runtime';
import type { SessionIndex } from '@polkadot/types/interfaces/session';
import type { EraIndex } from '@polkadot/types/interfaces/staking';
import type { WeightToFeeCoefficient } from '@polkadot/types/interfaces/support';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/consts' {
  export interface AugmentedConsts<ApiType> {
    babe: {
      /**
       * The number of **slots** that an epoch takes. We couple sessions to
       * epochs, i.e. we start a new session once the new epoch begins.
       **/
      epochDuration: u64 & AugmentedConst<ApiType>;
      /**
       * The expected average block time at which BABE should be creating
       * blocks. Since BABE is probabilistic it is not trivial to figure out
       * what the expected average block time should be based on the slot
       * duration and the security parameter `c` (where `1 - c` represents
       * the probability of a slot being empty).
       **/
      expectedBlockTime: Moment & AugmentedConst<ApiType>;
    };
    balances: {
      /**
       * The minimum amount required to keep an account open.
       **/
      existentialDeposit: Balance & AugmentedConst<ApiType>;
    };
    bounty: {
      /**
       * Exports const - bounty lock id.
       **/
      bountyLockId: LockIdentifier & AugmentedConst<ApiType>;
      /**
       * Exports const - max work entry number for a closed assurance type contract bounty.
       **/
      closedContractSizeLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - min cherry value limit for a bounty.
       **/
      minCherryLimit: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Exports const - min funding amount limit for a bounty.
       **/
      minFundingLimit: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Exports const - min work entrant stake for a bounty.
       **/
      minWorkEntrantStake: BalanceOf & AugmentedConst<ApiType>;
    };
    content: {
      /**
       * Exports const -  max number of curators per group
       **/
      maxNumberOfCuratorsPerGroup: MaxNumber & AugmentedConst<ApiType>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: Balance & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: Balance & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: LockIdentifier & AugmentedConst<ApiType>;
    };
    council: {
      /**
       * Duration of annoncing period
       **/
      announcingPeriodDuration: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Interval between automatic budget refills.
       **/
      budgetRefillPeriod: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Exports const - candidacy lock id.
       **/
      candidacyLockId: LockIdentifier & AugmentedConst<ApiType>;
      /**
       * Exports const - councilor lock id.
       **/
      councilorLockId: LockIdentifier & AugmentedConst<ApiType>;
      /**
       * Council member count
       **/
      councilSize: u64 & AugmentedConst<ApiType>;
      /**
       * Interval for automatic reward payments.
       **/
      electedMemberRewardPeriod: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Duration of idle period
       **/
      idlePeriodDuration: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Minimum stake candidate has to lock
       **/
      minCandidateStake: Balance & AugmentedConst<ApiType>;
      /**
       * Minimum number of extra candidates needed for the valid election.
       * Number of total candidates is equal to council size plus extra candidates.
       **/
      minNumberOfExtraCandidates: u64 & AugmentedConst<ApiType>;
    };
    finalityTracker: {
      /**
       * The delay after which point things become suspicious. Default is 1000.
       **/
      reportLatency: BlockNumber & AugmentedConst<ApiType>;
      /**
       * The number of recent samples to keep from this chain. Default is 101.
       **/
      windowSize: BlockNumber & AugmentedConst<ApiType>;
    };
    forum: {
      /**
       * Exports const
       * Deposit needed to create a post
       **/
      postDeposit: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Deposit needed to create a thread
       **/
      threadDeposit: BalanceOf & AugmentedConst<ApiType>;
    };
    forumWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: Balance & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: Balance & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: LockIdentifier & AugmentedConst<ApiType>;
    };
    gatewayWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: Balance & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: Balance & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: LockIdentifier & AugmentedConst<ApiType>;
    };
    members: {
      /**
       * Exports const - Stake needed to candidate as staking account.
       **/
      candidateStake: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Exports const - default balance for the invited member.
       **/
      defaultInitialInvitationBalance: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Exports const - default membership fee.
       **/
      defaultMembershipPrice: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Exports const - invited member lock id.
       **/
      invitedMemberLockId: LockIdentifier & AugmentedConst<ApiType>;
      /**
       * Exports const - maximum percent value of the membership fee for the referral cut.
       **/
      referralCutMaximumPercent: u8 & AugmentedConst<ApiType>;
      /**
       * Exports const - staking candidate lock id.
       **/
      stakingCandidateLockId: LockIdentifier & AugmentedConst<ApiType>;
    };
    membershipWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: Balance & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: Balance & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: LockIdentifier & AugmentedConst<ApiType>;
    };
    operationsWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: Balance & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: Balance & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: LockIdentifier & AugmentedConst<ApiType>;
    };
    proposalsCodex: {
      /**
       * Exports 'Amend Constitution' proposal parameters.
       **/
      amendConstitutionProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Cancel Working Group Lead Opening' proposal parameters.
       **/
      cancelWorkingGroupLeadOpeningProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      createBlogPostProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Create Working Group Lead Opening' proposal parameters.
       **/
      createWorkingGroupLeadOpeningProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Decrease Working Group Lead Stake' proposal parameters.
       **/
      decreaseWorkingGroupLeadStakeProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      editBlogPostProoposalParamters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Fill Working Group Lead Opening' proposal parameters.
       **/
      fillWorkingGroupOpeningProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Funding Request' proposal parameters.
       **/
      fundingRequestProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      lockBlogPostProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Runtime Upgrade' proposal parameters.
       **/
      runtimeUpgradeProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports `Set Council Budget Increment` proposal parameters.
       **/
      setCouncilBudgetIncrementProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports `Set Councilor Reward Proposal Parameters` proposal parameters.
       **/
      setCouncilorRewardProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports `Set Initial Invitation Balance` proposal parameters.
       **/
      setInitialInvitationBalanceProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      setInvitationCountProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Set Max Validator Count' proposal parameters.
       **/
      setMaxValidatorCountProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      setMembershipLeadInvitationQuotaProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Set Membership Price' proposal parameters.
       **/
      setMembershipPriceProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      setReferralCutProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Set Working Group Lead Reward' proposal parameters.
       **/
      setWorkingGroupLeadRewardProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Signal' proposal parameters.
       **/
      signalProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Slash Working Group Lead' proposal parameters.
       **/
      slashWorkingGroupLeadProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Terminate Working Group Lead' proposal parameters.
       **/
      terminateWorkingGroupLeadProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      unlockBlogPostProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Update Working Group Budget' proposal parameters.
       **/
      updateWorkingGroupBudgetProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      vetoProposalProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
    };
    proposalsEngine: {
      /**
       * Exports const - the fee is applied when cancel the proposal. A fee would be slashed (burned).
       **/
      cancellationFee: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Exports const -  max allowed proposal description length.
       **/
      descriptionMaxLength: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const -  max simultaneous active proposals number.
       **/
      maxActiveProposalLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const -  the fee is applied when the proposal gets rejected. A fee would
       * be slashed (burned).
       **/
      rejectionFee: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Exports const - staking handler lock id.
       **/
      stakingHandlerLockId: LockIdentifier & AugmentedConst<ApiType>;
      /**
       * Exports const -  max allowed proposal title length.
       **/
      titleMaxLength: u32 & AugmentedConst<ApiType>;
    };
    referendum: {
      /**
       * Maximum length of vote commitment salt. Use length that ensures uniqueness for hashing
       * e.g. std::u64::MAX.
       **/
      maxSaltLength: u64 & AugmentedConst<ApiType>;
      /**
       * Minimum stake needed for voting
       **/
      minimumStake: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Duration of revealing stage (number of blocks)
       **/
      revealStageDuration: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Exports const - staking handler lock id.
       **/
      stakingHandlerLockId: LockIdentifier & AugmentedConst<ApiType>;
      /**
       * Duration of voting stage (number of blocks)
       **/
      voteStageDuration: BlockNumber & AugmentedConst<ApiType>;
    };
    staking: {
      /**
       * Number of eras that staked funds must remain bonded for.
       **/
      bondingDuration: EraIndex & AugmentedConst<ApiType>;
      /**
       * The number of blocks before the end of the era from which election submissions are allowed.
       * 
       * Setting this to zero will disable the offchain compute and only on-chain seq-phragmen will
       * be used.
       * 
       * This is bounded by being within the last session. Hence, setting it to a value more than the
       * length of a session will be pointless.
       **/
      electionLookahead: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Maximum number of balancing iterations to run in the offchain submission.
       * 
       * If set to 0, balance_solution will not be executed at all.
       **/
      maxIterations: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum number of nominators rewarded for each validator.
       * 
       * For each validator only the `$MaxNominatorRewardedPerValidator` biggest stakers can claim
       * their reward. This used to limit the i/o cost for the nominator payout.
       **/
      maxNominatorRewardedPerValidator: u32 & AugmentedConst<ApiType>;
      /**
       * The threshold of improvement that should be provided for a new solution to be accepted.
       **/
      minSolutionScoreBump: Perbill & AugmentedConst<ApiType>;
      /**
       * Number of sessions per era.
       **/
      sessionsPerEra: SessionIndex & AugmentedConst<ApiType>;
      /**
       * Number of eras that slashes are deferred by, after computation.
       * 
       * This should be less than the bonding duration.
       * Set to 0 if slashes should be applied immediately, without opportunity for
       * intervention.
       **/
      slashDeferDuration: EraIndex & AugmentedConst<ApiType>;
    };
    storageWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: Balance & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: Balance & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: LockIdentifier & AugmentedConst<ApiType>;
    };
    system: {
      /**
       * The base weight of executing a block, independent of the transactions in the block.
       **/
      blockExecutionWeight: Weight & AugmentedConst<ApiType>;
      /**
       * The maximum number of blocks to allow in mortal eras.
       **/
      blockHashCount: BlockNumber & AugmentedConst<ApiType>;
      /**
       * The weight of runtime database operations the runtime can invoke.
       **/
      dbWeight: RuntimeDbWeight & AugmentedConst<ApiType>;
      /**
       * The base weight of an Extrinsic in the block, independent of the of extrinsic being executed.
       **/
      extrinsicBaseWeight: Weight & AugmentedConst<ApiType>;
      /**
       * The maximum length of a block (in bytes).
       **/
      maximumBlockLength: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum weight of a block.
       **/
      maximumBlockWeight: Weight & AugmentedConst<ApiType>;
    };
    timestamp: {
      /**
       * The minimum period between blocks. Beware that this is different to the *expected* period
       * that the block production apparatus provides. Your chosen consensus system will generally
       * work with this to determine a sensible block time. e.g. For Aura, it will be double this
       * period on default settings.
       **/
      minimumPeriod: Moment & AugmentedConst<ApiType>;
    };
    transactionPayment: {
      /**
       * The fee to be paid for making a transaction; the per-byte portion.
       **/
      transactionByteFee: BalanceOf & AugmentedConst<ApiType>;
      /**
       * The polynomial that is applied in order to derive fee from weight.
       **/
      weightToFee: Vec<WeightToFeeCoefficient> & AugmentedConst<ApiType>;
    };
  }

  export interface QueryableConsts<ApiType extends ApiTypes> extends AugmentedConsts<ApiType> {
  }
}
