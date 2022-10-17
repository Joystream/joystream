// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api-base/types';
import type { U8aFixed, Vec, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
import type { Perbill } from '@polkadot/types/interfaces/runtime';
import type { FrameSupportWeightsRuntimeDbWeight, FrameSystemLimitsBlockLength, FrameSystemLimitsBlockWeights, PalletContentLimitPerPeriod, PalletProposalsEngineProposalParameters, SpVersionRuntimeVersion } from '@polkadot/types/lookup';

declare module '@polkadot/api-base/types/consts' {
  export interface AugmentedConsts<ApiType extends ApiTypes> {
    authorship: {
      /**
       * The number of blocks back we should accept uncles.
       * This means that we will deal with uncle-parents that are
       * `UncleGenerations + 1` before `now`.
       **/
      uncleGenerations: u32 & AugmentedConst<ApiType>;
    };
    babe: {
      /**
       * The amount of time, in slots, that each epoch should last.
       * NOTE: Currently it is not possible to change the epoch duration after
       * the chain has started. Attempting to do so will brick block production.
       **/
      epochDuration: u64 & AugmentedConst<ApiType>;
      /**
       * The expected average block time at which BABE should be creating
       * blocks. Since BABE is probabilistic it is not trivial to figure out
       * what the expected average block time should be based on the slot
       * duration and the security parameter `c` (where `1 - c` represents
       * the probability of a slot being empty).
       **/
      expectedBlockTime: u64 & AugmentedConst<ApiType>;
      /**
       * Max number of authorities allowed
       **/
      maxAuthorities: u32 & AugmentedConst<ApiType>;
    };
    bagsList: {
      /**
       * The list of thresholds separating the various bags.
       * 
       * Ids are separated into unsorted bags according to their score. This specifies the
       * thresholds separating the bags. An id's bag is the largest bag for which the id's score
       * is less than or equal to its upper threshold.
       * 
       * When ids are iterated, higher bags are iterated completely before lower bags. This means
       * that iteration is _semi-sorted_: ids of higher score tend to come before ids of lower
       * score, but peer ids within a particular bag are sorted in insertion order.
       * 
       * # Expressing the constant
       * 
       * This constant must be sorted in strictly increasing order. Duplicate items are not
       * permitted.
       * 
       * There is an implied upper limit of `Score::MAX`; that value does not need to be
       * specified within the bag. For any two threshold lists, if one ends with
       * `Score::MAX`, the other one does not, and they are otherwise equal, the two
       * lists will behave identically.
       * 
       * # Calculation
       * 
       * It is recommended to generate the set of thresholds in a geometric series, such that
       * there exists some constant ratio such that `threshold[k + 1] == (threshold[k] *
       * constant_ratio).max(threshold[k] + 1)` for all `k`.
       * 
       * The helpers in the `/utils/frame/generate-bags` module can simplify this calculation.
       * 
       * # Examples
       * 
       * - If `BagThresholds::get().is_empty()`, then all ids are put into the same bag, and
       * iteration is strictly in insertion order.
       * - If `BagThresholds::get().len() == 64`, and the thresholds are determined according to
       * the procedure given above, then the constant ratio is equal to 2.
       * - If `BagThresholds::get().len() == 200`, and the thresholds are determined according to
       * the procedure given above, then the constant ratio is approximately equal to 1.248.
       * - If the threshold list begins `[1, 2, 3, ...]`, then an id with score 0 or 1 will fall
       * into bag 0, an id with score 2 will fall into bag 1, etc.
       * 
       * # Migration
       * 
       * In the event that this list ever changes, a copy of the old bags list must be retained.
       * With that `List::migrate` can be called, which will perform the appropriate migration.
       **/
      bagThresholds: Vec<u64> & AugmentedConst<ApiType>;
    };
    balances: {
      /**
       * The minimum amount required to keep an account open.
       **/
      existentialDeposit: u128 & AugmentedConst<ApiType>;
      /**
       * The maximum number of locks that should exist on an account.
       * Not strictly enforced, but used for weight estimation.
       **/
      maxLocks: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum number of named reserves that can exist on an account.
       **/
      maxReserves: u32 & AugmentedConst<ApiType>;
    };
    bounty: {
      /**
       * Exports const - max work entry number for a closed assurance type contract bounty.
       **/
      closedContractSizeLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - creator state bloat bond amount for a bounty.
       **/
      creatorStateBloatBondAmount: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const - funder state bloat bond amount for a bounty.
       **/
      funderStateBloatBondAmount: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const - min work entrant stake for a bounty.
       **/
      minWorkEntrantStake: u128 & AugmentedConst<ApiType>;
    };
    content: {
      /**
       * Exports const - default channel daily NFT limit.
       **/
      defaultChannelDailyNftLimit: PalletContentLimitPerPeriod & AugmentedConst<ApiType>;
      /**
       * Exports const - default channel weekly NFT limit.
       **/
      defaultChannelWeeklyNftLimit: PalletContentLimitPerPeriod & AugmentedConst<ApiType>;
      /**
       * Exports const - default global daily NFT limit.
       **/
      defaultGlobalDailyNftLimit: PalletContentLimitPerPeriod & AugmentedConst<ApiType>;
      /**
       * Exports const - default global weekly NFT limit.
       **/
      defaultGlobalWeeklyNftLimit: PalletContentLimitPerPeriod & AugmentedConst<ApiType>;
      /**
       * Exports const - max number of keys per curator_group.permissions_by_level map instance
       **/
      maxKeysPerCuratorGroupPermissionsByLevelMap: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - max nft auction whitelist length
       **/
      maxNftAuctionWhitelistLength: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - max number of curators per group
       **/
      maxNumberOfCuratorsPerGroup: u32 & AugmentedConst<ApiType>;
    };
    contentWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    council: {
      /**
       * Duration of annoncing period
       **/
      announcingPeriodDuration: u32 & AugmentedConst<ApiType>;
      /**
       * Interval between automatic budget refills.
       **/
      budgetRefillPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - candidacy lock id.
       **/
      candidacyLockId: U8aFixed & AugmentedConst<ApiType>;
      /**
       * Exports const - councilor lock id.
       **/
      councilorLockId: U8aFixed & AugmentedConst<ApiType>;
      /**
       * Council member count
       **/
      councilSize: u32 & AugmentedConst<ApiType>;
      /**
       * Interval for automatic reward payments.
       **/
      electedMemberRewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Duration of idle period
       **/
      idlePeriodDuration: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake candidate has to lock
       **/
      minCandidateStake: u128 & AugmentedConst<ApiType>;
      /**
       * Minimum number of extra candidates needed for the valid election.
       * Number of total candidates is equal to council size plus extra candidates.
       **/
      minNumberOfExtraCandidates: u32 & AugmentedConst<ApiType>;
    };
    distributionWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    electionProviderMultiPhase: {
      /**
       * The minimum amount of improvement to the solution score that defines a solution as
       * "better" in the Signed phase.
       **/
      betterSignedThreshold: Perbill & AugmentedConst<ApiType>;
      /**
       * The minimum amount of improvement to the solution score that defines a solution as
       * "better" in the Unsigned phase.
       **/
      betterUnsignedThreshold: Perbill & AugmentedConst<ApiType>;
      /**
       * The maximum number of electable targets to put in the snapshot.
       **/
      maxElectableTargets: u16 & AugmentedConst<ApiType>;
      /**
       * The maximum number of electing voters to put in the snapshot. At the moment, snapshots
       * are only over a single block, but once multi-block elections are introduced they will
       * take place over multiple blocks.
       **/
      maxElectingVoters: u32 & AugmentedConst<ApiType>;
      /**
       * The priority of the unsigned transaction submitted in the unsigned-phase
       **/
      minerTxPriority: u64 & AugmentedConst<ApiType>;
      /**
       * The repeat threshold of the offchain worker.
       * 
       * For example, if it is 5, that means that at least 5 blocks will elapse between attempts
       * to submit the worker's solution.
       **/
      offchainRepeat: u32 & AugmentedConst<ApiType>;
      /**
       * Base deposit for a signed solution.
       **/
      signedDepositBase: u128 & AugmentedConst<ApiType>;
      /**
       * Per-byte deposit for a signed solution.
       **/
      signedDepositByte: u128 & AugmentedConst<ApiType>;
      /**
       * Per-weight deposit for a signed solution.
       **/
      signedDepositWeight: u128 & AugmentedConst<ApiType>;
      /**
       * The maximum amount of unchecked solutions to refund the call fee for.
       **/
      signedMaxRefunds: u32 & AugmentedConst<ApiType>;
      /**
       * Maximum number of signed submissions that can be queued.
       * 
       * It is best to avoid adjusting this during an election, as it impacts downstream data
       * structures. In particular, `SignedSubmissionIndices<T>` is bounded on this value. If you
       * update this value during an election, you _must_ ensure that
       * `SignedSubmissionIndices.len()` is less than or equal to the new value. Otherwise,
       * attempts to submit new solutions may cause a runtime panic.
       **/
      signedMaxSubmissions: u32 & AugmentedConst<ApiType>;
      /**
       * Maximum weight of a signed solution.
       * 
       * If [`Config::MinerConfig`] is being implemented to submit signed solutions (outside of
       * this pallet), then [`MinerConfig::solution_weight`] is used to compare against
       * this value.
       **/
      signedMaxWeight: u64 & AugmentedConst<ApiType>;
      /**
       * Duration of the signed phase.
       **/
      signedPhase: u32 & AugmentedConst<ApiType>;
      /**
       * Base reward for a signed solution
       **/
      signedRewardBase: u128 & AugmentedConst<ApiType>;
      /**
       * Duration of the unsigned phase.
       **/
      unsignedPhase: u32 & AugmentedConst<ApiType>;
    };
    forum: {
      /**
       * MaxDirectSubcategoriesInCategory
       **/
      maxDirectSubcategoriesInCategory: u64 & AugmentedConst<ApiType>;
      /**
       * MaxTotalCategories
       **/
      maxTotalCategories: u64 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Deposit needed to create a post
       **/
      postDeposit: u128 & AugmentedConst<ApiType>;
      /**
       * Deposit needed to create a thread
       **/
      threadDeposit: u128 & AugmentedConst<ApiType>;
    };
    forumWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    gatewayWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    grandpa: {
      /**
       * Max Authorities in use
       **/
      maxAuthorities: u32 & AugmentedConst<ApiType>;
    };
    imOnline: {
      /**
       * A configuration for base priority of unsigned transactions.
       * 
       * This is exposed so that it can be tuned for particular runtime, when
       * multiple pallets send unsigned transactions.
       **/
      unsignedPriority: u64 & AugmentedConst<ApiType>;
    };
    members: {
      /**
       * Exports const - Stake needed to candidate as staking account.
       **/
      candidateStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const - default balance for the invited member.
       **/
      defaultInitialInvitationBalance: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const - default membership fee.
       **/
      defaultMembershipPrice: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const - invited member lock id.
       **/
      invitedMemberLockId: U8aFixed & AugmentedConst<ApiType>;
      /**
       * Exports const - maximum percent value of the membership fee for the referral cut.
       **/
      referralCutMaximumPercent: u8 & AugmentedConst<ApiType>;
      /**
       * Exports const - staking candidate lock id.
       **/
      stakingCandidateLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    membershipWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    multisig: {
      /**
       * The base amount of currency needed to reserve for creating a multisig execution or to
       * store a dispatch call for later.
       * 
       * This is held for an additional storage item whose value size is
       * `4 + sizeof((BlockNumber, Balance, AccountId))` bytes and whose key size is
       * `32 + sizeof(AccountId)` bytes.
       **/
      depositBase: u128 & AugmentedConst<ApiType>;
      /**
       * The amount of currency needed per unit threshold when creating a multisig execution.
       * 
       * This is held for adding 32 bytes more into a pre-existing storage value.
       **/
      depositFactor: u128 & AugmentedConst<ApiType>;
      /**
       * The maximum amount of signatories allowed in the multisig.
       **/
      maxSignatories: u16 & AugmentedConst<ApiType>;
    };
    operationsWorkingGroupAlpha: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    operationsWorkingGroupBeta: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    operationsWorkingGroupGamma: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    proposalsCodex: {
      /**
       * Exports 'Amend Constitution' proposal parameters.
       **/
      amendConstitutionProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Cancel Working Group Lead Opening' proposal parameters.
       **/
      cancelWorkingGroupLeadOpeningProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Create Working Group Lead Opening' proposal parameters.
       **/
      createWorkingGroupLeadOpeningProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Decrease Working Group Lead Stake' proposal parameters.
       **/
      decreaseWorkingGroupLeadStakeProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Fill Working Group Lead Opening' proposal parameters.
       **/
      fillWorkingGroupOpeningProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Max number of accounts per funding request proposal
       **/
      fundingRequestProposalMaxAccounts: u32 & AugmentedConst<ApiType>;
      /**
       * Maximum total amount in funding request proposal
       **/
      fundingRequestProposalMaxTotalAmount: u128 & AugmentedConst<ApiType>;
      /**
       * Exports 'Funding Request' proposal parameters.
       **/
      fundingRequestProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Runtime Upgrade' proposal parameters.
       **/
      runtimeUpgradeProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports `Set Council Budget Increment` proposal parameters.
       **/
      setCouncilBudgetIncrementProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports `Set Councilor Reward Proposal Parameters` proposal parameters.
       **/
      setCouncilorRewardProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports `Set Initial Invitation Balance` proposal parameters.
       **/
      setInitialInvitationBalanceProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      setInvitationCountProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Max allowed number of validators in set max validator count proposal
       **/
      setMaxValidatorCountProposalMaxValidators: u32 & AugmentedConst<ApiType>;
      /**
       * Exports 'Set Max Validator Count' proposal parameters.
       **/
      setMaxValidatorCountProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      setMembershipLeadInvitationQuotaProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Set Membership Price' proposal parameters.
       **/
      setMembershipPriceProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      setReferralCutProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Set Working Group Lead Reward' proposal parameters.
       **/
      setWorkingGroupLeadRewardProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Signal' proposal parameters.
       **/
      signalProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Slash Working Group Lead' proposal parameters.
       **/
      slashWorkingGroupLeadProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Terminate Working Group Lead' proposal parameters.
       **/
      terminateWorkingGroupLeadProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      updateChannelPayoutsProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      updateGlobalNftLimitProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Update Working Group Budget' proposal parameters.
       **/
      updateWorkingGroupBudgetProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
      vetoProposalProposalParameters: PalletProposalsEngineProposalParameters & AugmentedConst<ApiType>;
    };
    proposalsDiscussion: {
      /**
       * Exports const - author list size limit for the Closed discussion.
       **/
      maxWhiteListSize: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - fee for creating a post
       **/
      postDeposit: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const - maximum number of blocks before a post can be erased by anyone
       **/
      postLifeTime: u32 & AugmentedConst<ApiType>;
    };
    proposalsEngine: {
      /**
       * Exports const - the fee is applied when cancel the proposal. A fee would be slashed (burned).
       **/
      cancellationFee: u128 & AugmentedConst<ApiType>;
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
      rejectionFee: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const - staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
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
      minimumStake: u128 & AugmentedConst<ApiType>;
      /**
       * Duration of revealing stage (number of blocks)
       **/
      revealStageDuration: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
      /**
       * Duration of voting stage (number of blocks)
       **/
      voteStageDuration: u32 & AugmentedConst<ApiType>;
    };
    staking: {
      /**
       * Number of eras that staked funds must remain bonded for.
       **/
      bondingDuration: u32 & AugmentedConst<ApiType>;
      /**
       * Maximum number of nominations per nominator.
       **/
      maxNominations: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum number of nominators rewarded for each validator.
       * 
       * For each validator only the `$MaxNominatorRewardedPerValidator` biggest stakers can
       * claim their reward. This used to limit the i/o cost for the nominator payout.
       **/
      maxNominatorRewardedPerValidator: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum number of `unlocking` chunks a [`StakingLedger`] can have. Effectively
       * determines how many unique eras a staker may be unbonding in.
       **/
      maxUnlockingChunks: u32 & AugmentedConst<ApiType>;
      /**
       * Number of sessions per era.
       **/
      sessionsPerEra: u32 & AugmentedConst<ApiType>;
      /**
       * Number of eras that slashes are deferred by, after computation.
       * 
       * This should be less than the bonding duration. Set to 0 if slashes
       * should be applied immediately, without opportunity for intervention.
       **/
      slashDeferDuration: u32 & AugmentedConst<ApiType>;
    };
    storage: {
      /**
       * Exports const - maximum size of the "hash blacklist" collection.
       **/
      blacklistSizeLimit: u64 & AugmentedConst<ApiType>;
      /**
       * Exports const - the default dynamic bag creation policy for channels (storage bucket
       * number).
       **/
      defaultChannelDynamicBagNumberOfStorageBuckets: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - the default dynamic bag creation policy for members (storage bucket
       * number).
       **/
      defaultMemberDynamicBagNumberOfStorageBuckets: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - max data object size in bytes.
       **/
      maxDataObjectSize: u64 & AugmentedConst<ApiType>;
      /**
       * Exports const - max allowed distribution bucket family number.
       **/
      maxDistributionBucketFamilyNumber: u64 & AugmentedConst<ApiType>;
      /**
       * Exports const - maximum number of distribution buckets per bag.
       **/
      maxDistributionBucketsPerBag: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - max number of operators per distribution bucket.
       **/
      maxNumberOfOperatorsPerDistributionBucket: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - max number of pending invitations per distribution bucket.
       **/
      maxNumberOfPendingInvitationsPerDistributionBucket: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - maximum number of storage buckets per bag.
       **/
      maxStorageBucketsPerBag: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - minimum number of distribution buckets per bag.
       **/
      minDistributionBucketsPerBag: u32 & AugmentedConst<ApiType>;
      /**
       * Exports const - minimum number of storage buckets per bag.
       **/
      minStorageBucketsPerBag: u32 & AugmentedConst<ApiType>;
    };
    storageWorkingGroup: {
      /**
       * Stake needed to create an opening.
       **/
      leaderOpeningStake: u128 & AugmentedConst<ApiType>;
      /**
       * Exports const
       * Max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Minimum stake required for applying into an opening.
       **/
      minimumApplicationStake: u128 & AugmentedConst<ApiType>;
      /**
       * Defines min unstaking period in the group.
       **/
      minUnstakingPeriodLimit: u32 & AugmentedConst<ApiType>;
      /**
       * Defines the period every worker gets paid in blocks.
       **/
      rewardPeriod: u32 & AugmentedConst<ApiType>;
      /**
       * Staking handler lock id.
       **/
      stakingHandlerLockId: U8aFixed & AugmentedConst<ApiType>;
    };
    system: {
      /**
       * Maximum number of block number to block hash mappings to keep (oldest pruned first).
       **/
      blockHashCount: u32 & AugmentedConst<ApiType>;
      /**
       * The maximum length of a block (in bytes).
       **/
      blockLength: FrameSystemLimitsBlockLength & AugmentedConst<ApiType>;
      /**
       * Block & extrinsics weights: base values and limits.
       **/
      blockWeights: FrameSystemLimitsBlockWeights & AugmentedConst<ApiType>;
      /**
       * The weight of runtime database operations the runtime can invoke.
       **/
      dbWeight: FrameSupportWeightsRuntimeDbWeight & AugmentedConst<ApiType>;
      /**
       * The designated SS85 prefix of this chain.
       * 
       * This replaces the "ss58Format" property declared in the chain spec. Reason is
       * that the runtime should know about the prefix in order to make use of it as
       * an identifier of the chain.
       **/
      ss58Prefix: u16 & AugmentedConst<ApiType>;
      /**
       * Get the chain's current version.
       **/
      version: SpVersionRuntimeVersion & AugmentedConst<ApiType>;
    };
    timestamp: {
      /**
       * The minimum period between blocks. Beware that this is different to the *expected*
       * period that the block production apparatus provides. Your chosen consensus system will
       * generally work with this to determine a sensible block time. e.g. For Aura, it will be
       * double this period on default settings.
       **/
      minimumPeriod: u64 & AugmentedConst<ApiType>;
    };
    transactionPayment: {
      /**
       * A fee mulitplier for `Operational` extrinsics to compute "virtual tip" to boost their
       * `priority`
       * 
       * This value is multipled by the `final_fee` to obtain a "virtual tip" that is later
       * added to a tip component in regular `priority` calculations.
       * It means that a `Normal` transaction can front-run a similarly-sized `Operational`
       * extrinsic (with no tip), by including a tip value greater than the virtual tip.
       * 
       * ```rust,ignore
       * // For `Normal`
       * let priority = priority_calc(tip);
       * 
       * // For `Operational`
       * let virtual_tip = (inclusion_fee + tip) * OperationalFeeMultiplier;
       * let priority = priority_calc(tip + virtual_tip);
       * ```
       * 
       * Note that since we use `final_fee` the multiplier applies also to the regular `tip`
       * sent with the transaction. So, not only does the transaction get a priority bump based
       * on the `inclusion_fee`, but we also amplify the impact of tips applied to `Operational`
       * transactions.
       **/
      operationalFeeMultiplier: u8 & AugmentedConst<ApiType>;
    };
    utility: {
      /**
       * The limit on the number of batched calls.
       **/
      batchedCallsLimit: u32 & AugmentedConst<ApiType>;
    };
    vesting: {
      maxVestingSchedules: u32 & AugmentedConst<ApiType>;
      /**
       * The minimum amount transferred to call `vested_transfer`.
       **/
      minVestedTransfer: u128 & AugmentedConst<ApiType>;
    };
  } // AugmentedConsts
} // declare module
