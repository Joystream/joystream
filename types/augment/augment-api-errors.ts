// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/errors' {
  export interface AugmentedErrors<ApiType> {
    authorship: {
      /**
       * The uncle is genesis.
       **/
      GenesisUncle: AugmentedError<ApiType>;
      /**
       * The uncle parent not in the chain.
       **/
      InvalidUncleParent: AugmentedError<ApiType>;
      /**
       * The uncle isn't recent enough to be included.
       **/
      OldUncle: AugmentedError<ApiType>;
      /**
       * The uncle is too high in chain.
       **/
      TooHighUncle: AugmentedError<ApiType>;
      /**
       * Too many uncles.
       **/
      TooManyUncles: AugmentedError<ApiType>;
      /**
       * The uncle is already included.
       **/
      UncleAlreadyIncluded: AugmentedError<ApiType>;
      /**
       * Uncles already set in the block.
       **/
      UnclesAlreadySet: AugmentedError<ApiType>;
    };
    balances: {
      /**
       * Beneficiary account must pre-exist
       **/
      DeadAccount: AugmentedError<ApiType>;
      /**
       * Value too low to create account due to existential deposit
       **/
      ExistentialDeposit: AugmentedError<ApiType>;
      /**
       * A vesting schedule already exists for this account
       **/
      ExistingVestingSchedule: AugmentedError<ApiType>;
      /**
       * Balance too low to send value
       **/
      InsufficientBalance: AugmentedError<ApiType>;
      /**
       * Transfer/payment would kill account
       **/
      KeepAlive: AugmentedError<ApiType>;
      /**
       * Account liquidity restrictions prevent withdrawal
       **/
      LiquidityRestrictions: AugmentedError<ApiType>;
      /**
       * Got an overflow after adding
       **/
      Overflow: AugmentedError<ApiType>;
      /**
       * Vesting balance too high to send value
       **/
      VestingBalance: AugmentedError<ApiType>;
    };
    blog: {
      /**
       * A non-owner is trying to do a privilegeded action.
       **/
      BlogOwnershipError: AugmentedError<ApiType>;
      /**
       * Insuficient balance for reply creation
       **/
      InsufficientBalanceForReply: AugmentedError<ApiType>;
      /**
       * This error represent the invalid state where there is not enough funds in a post
       * account to pay off its delete
       **/
      InsufficientBalanceInPostAccount: AugmentedError<ApiType>;
      /**
       * Reaction doesn't exists
       **/
      InvalidReactionIndex: AugmentedError<ApiType>;
      /**
       * A non-member is trying to participate
       **/
      MembershipError: AugmentedError<ApiType>;
      /**
       * Number of posts exceeds limits.
       **/
      PostLimitReached: AugmentedError<ApiType>;
      /**
       * Post is locked for modifications.
       **/
      PostLockedError: AugmentedError<ApiType>;
      /**
       * Post do not exists.
       **/
      PostNotFound: AugmentedError<ApiType>;
      /**
       * Reply do no exists.
       **/
      ReplyNotFound: AugmentedError<ApiType>;
      /**
       * A non-owner of a reply is trying to do a privileged action.
       **/
      ReplyOwnershipError: AugmentedError<ApiType>;
    };
    bounty: {
      /**
       * Bounty doesnt exist.
       **/
      BountyDoesntExist: AugmentedError<ApiType>;
      /**
       * Incompatible assurance contract type for a member: cannot submit work to the 'closed
       * assurance' bounty contract.
       **/
      CannotSubmitWorkToClosedContractBounty: AugmentedError<ApiType>;
      /**
       * Cherry less then minimum allowed.
       **/
      CherryLessThenMinimumAllowed: AugmentedError<ApiType>;
      /**
       * Cannot create a 'closed assurance contract' bounty with empty member list.
       **/
      ClosedContractMemberListIsEmpty: AugmentedError<ApiType>;
      /**
       * Cannot create a 'closed assurance contract' bounty with member list larger
       * than allowed max work entry limit.
       **/
      ClosedContractMemberListIsTooLarge: AugmentedError<ApiType>;
      /**
       * The conflicting stake discovered. Cannot stake.
       **/
      ConflictingStakes: AugmentedError<ApiType>;
      /**
       * Cannot create a bounty with an entrant stake is less than required minimum.
       **/
      EntrantStakeIsLessThanMininum: AugmentedError<ApiType>;
      /**
       * Cannot create a bounty with zero funding amount parameter.
       **/
      FundingAmountCannotBeZero: AugmentedError<ApiType>;
      /**
       * Funding amount less then minimum allowed.
       **/
      FundingLessThenMinimumAllowed: AugmentedError<ApiType>;
      /**
       * Cannot create a bounty with zero funding period parameter.
       **/
      FundingPeriodCannotBeZero: AugmentedError<ApiType>;
      /**
       * Funding period is not expired for the bounty.
       **/
      FundingPeriodNotExpired: AugmentedError<ApiType>;
      /**
       * Insufficient balance for a bounty cherry.
       **/
      InsufficientBalanceForBounty: AugmentedError<ApiType>;
      /**
       * There is not enough balance for a stake.
       **/
      InsufficientBalanceForStake: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: FailedBountyWithdrawal.
       **/
      InvalidStageUnexpectedFailedBountyWithdrawal: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: Funding.
       **/
      InvalidStageUnexpectedFunding: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: FundingExpired.
       **/
      InvalidStageUnexpectedFundingExpired: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: Judgment.
       **/
      InvalidStageUnexpectedJudgment: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: SuccessfulBountyWithdrawal.
       **/
      InvalidStageUnexpectedSuccessfulBountyWithdrawal: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: WorkSubmission.
       **/
      InvalidStageUnexpectedWorkSubmission: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Judging period cannot be zero.
       **/
      JudgingPeriodCannotBeZero: AugmentedError<ApiType>;
      /**
       * Cannot add work entry because of the limit.
       **/
      MaxWorkEntryLimitReached: AugmentedError<ApiType>;
      /**
       * Min funding amount cannot be greater than max amount.
       **/
      MinFundingAmountCannotBeGreaterThanMaxAmount: AugmentedError<ApiType>;
      /**
       * Cannot submit a judgment without active work entries. A probable case for an error:
       * an entry with a single submission for a bounty was withdrawn.
       **/
      NoActiveWorkEntries: AugmentedError<ApiType>;
      /**
       * Cannot found bounty contribution.
       **/
      NoBountyContributionFound: AugmentedError<ApiType>;
      /**
       * Operation can be performed only by a bounty creator.
       **/
      NotBountyActor: AugmentedError<ApiType>;
      /**
       * There is nothing to withdraw.
       **/
      NothingToWithdraw: AugmentedError<ApiType>;
      /**
       * The total reward for winners should be equal to total bounty funding.
       **/
      TotalRewardShouldBeEqualToTotalFunding: AugmentedError<ApiType>;
      /**
       * Invalid judgment - all winners should have work submissions.
       **/
      WinnerShouldHasWorkSubmission: AugmentedError<ApiType>;
      /**
       * Work entry doesnt exist.
       **/
      WorkEntryDoesntExist: AugmentedError<ApiType>;
      /**
       * Work period cannot be zero.
       **/
      WorkPeriodCannotBeZero: AugmentedError<ApiType>;
      /**
       * Incorrect funding amount.
       **/
      ZeroFundingAmount: AugmentedError<ApiType>;
      /**
       * Cannot set zero reward for winners.
       **/
      ZeroWinnerReward: AugmentedError<ApiType>;
    };
    content: {
      /**
       * This content actor cannot own a channel
       **/
      ActorCannotOwnChannel: AugmentedError<ApiType>;
      /**
       * Operation cannot be perfomed with this Actor
       **/
      ActorNotAuthorized: AugmentedError<ApiType>;
      /**
       * Expected root or signed origin
       **/
      BadOrigin: AugmentedError<ApiType>;
      /**
       * Curators can only censor non-curator group owned channels
       **/
      CannotCensoreCuratorGroupOwnedChannels: AugmentedError<ApiType>;
      /**
       * A Channel or Video Category does not exist.
       **/
      CategoryDoesNotExist: AugmentedError<ApiType>;
      /**
       * Channel does not exist
       **/
      ChannelDoesNotExist: AugmentedError<ApiType>;
      /**
       * Curator authentication failed
       **/
      CuratorAuthFailed: AugmentedError<ApiType>;
      /**
       * Given curator group does not exist
       **/
      CuratorGroupDoesNotExist: AugmentedError<ApiType>;
      /**
       * Curator group is not active
       **/
      CuratorGroupIsNotActive: AugmentedError<ApiType>;
      /**
       * Curator id is not a worker id in content working group
       **/
      CuratorIdInvalid: AugmentedError<ApiType>;
      /**
       * Curator under provided curator id is already a member of curaror group under given id
       **/
      CuratorIsAlreadyAMemberOfGivenCuratorGroup: AugmentedError<ApiType>;
      /**
       * Curator under provided curator id is not a member of curaror group under given id
       **/
      CuratorIsNotAMemberOfGivenCuratorGroup: AugmentedError<ApiType>;
      /**
       * Max number of curators per group limit reached
       **/
      CuratorsPerGroupLimitReached: AugmentedError<ApiType>;
      /**
       * Feature Not Implemented
       **/
      FeatureNotImplemented: AugmentedError<ApiType>;
      /**
       * Lead authentication failed
       **/
      LeadAuthFailed: AugmentedError<ApiType>;
      /**
       * Member authentication failed
       **/
      MemberAuthFailed: AugmentedError<ApiType>;
      /**
       * Video does not exist
       **/
      VideoDoesNotExist: AugmentedError<ApiType>;
      /**
       * Video in season can`t be removed (because order is important)
       **/
      VideoInSeason: AugmentedError<ApiType>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    council: {
      /**
       * Origin is invalid.
       **/
      BadOrigin: AugmentedError<ApiType>;
      /**
       * Candidate haven't provided sufficient stake.
       **/
      CandidacyStakeTooLow: AugmentedError<ApiType>;
      /**
       * User tried to announce candidacy outside of the candidacy announcement period.
       **/
      CantCandidateNow: AugmentedError<ApiType>;
      /**
       * User tried to announce candidacy twice in the same elections.
       **/
      CantCandidateTwice: AugmentedError<ApiType>;
      /**
       * User tried to release stake outside of the revealing period.
       **/
      CantReleaseStakeNow: AugmentedError<ApiType>;
      /**
       * Candidate can't vote for himself.
       **/
      CantVoteForYourself: AugmentedError<ApiType>;
      /**
       * Can't withdraw candidacy outside of the candidacy announcement period.
       **/
      CantWithdrawCandidacyNow: AugmentedError<ApiType>;
      /**
       * User tried to announce candidacy with an account that has the conflicting type of stake
       * with candidacy stake and has not enough balance for staking for both purposes.
       **/
      ConflictingStake: AugmentedError<ApiType>;
      /**
       * Funding requests without recieving accounts
       **/
      EmptyFundingRequests: AugmentedError<ApiType>;
      /**
       * Insufficient balance for candidacy staking.
       **/
      InsufficientBalanceForStaking: AugmentedError<ApiType>;
      /**
       * Insufficent funds in council for executing 'Funding Request'
       **/
      InsufficientFundsForFundingRequest: AugmentedError<ApiType>;
      /**
       * The combination of membership id and account id is invalid for unstaking an existing
       * candidacy stake.
       **/
      InvalidAccountToStakeReuse: AugmentedError<ApiType>;
      /**
       * Invalid membership.
       **/
      MemberIdNotMatchAccount: AugmentedError<ApiType>;
      /**
       * User tried to release stake when no stake exists.
       **/
      NoStake: AugmentedError<ApiType>;
      /**
       * User tried to withdraw candidacy when not candidating.
       **/
      NotCandidatingNow: AugmentedError<ApiType>;
      /**
       * The member is not a councilor.
       **/
      NotCouncilor: AugmentedError<ApiType>;
      /**
       * The same account is recieving funds from the same request twice
       **/
      RepeatedFundRequestAccount: AugmentedError<ApiType>;
      /**
       * Council member and candidates can't withdraw stake yet.
       **/
      StakeStillNeeded: AugmentedError<ApiType>;
      /**
       * Fund request no balance
       **/
      ZeroBalanceFundRequest: AugmentedError<ApiType>;
    };
    dataDirectory: {
      /**
       * Content with this ID not found.
       **/
      CidNotFound: AugmentedError<ApiType>;
      /**
       * Content uploading blocked.
       **/
      ContentUploadingBlocked: AugmentedError<ApiType>;
      /**
       * "Data object already added under this content id".
       **/
      DataObjectAlreadyAdded: AugmentedError<ApiType>;
      /**
       * DataObject Injection Failed. Too Many DataObjects.
       **/
      DataObjectsInjectionExceededLimit: AugmentedError<ApiType>;
      /**
       * Cannot create content for inactive or missing data object type.
       **/
      DataObjectTypeMustBeActive: AugmentedError<ApiType>;
      /**
       * Provided owner should be equal o the data object owner under given content id
       **/
      OwnersAreNotEqual: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics.
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * New voucher limit being set is less than used.
       **/
      VoucherLimitLessThanUsed: AugmentedError<ApiType>;
      /**
       * Contant uploading failed. Actor voucher objects limit exceeded.
       **/
      VoucherObjectsLimitExceeded: AugmentedError<ApiType>;
      /**
       * Voucher objects limit upper bound exceeded
       **/
      VoucherObjectsLimitUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Overflow detected when changing
       **/
      VoucherOverflow: AugmentedError<ApiType>;
      /**
       * Contant uploading failed. Actor voucher size limit exceeded.
       **/
      VoucherSizeLimitExceeded: AugmentedError<ApiType>;
      /**
       * Voucher size limit upper bound exceeded
       **/
      VoucherSizeLimitUpperBoundExceeded: AugmentedError<ApiType>;
    };
    dataObjectStorageRegistry: {
      /**
       * Content with this ID not found.
       **/
      CidNotFound: AugmentedError<ApiType>;
      /**
       * No data object storage relationship found for this ID.
       **/
      DataObjectStorageRelationshipNotFound: AugmentedError<ApiType>;
      /**
       * Only the storage provider in a DOSR can decide whether they're ready.
       **/
      OnlyStorageProviderMayClaimReady: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
    };
    dataObjectTypeRegistry: {
      /**
       * Data Object Type with the given ID not found.
       **/
      DataObjectTypeNotFound: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
    };
    finalityTracker: {
      /**
       * Final hint must be updated only once in the block
       **/
      AlreadyUpdated: AugmentedError<ApiType>;
      /**
       * Finalized height above block number
       **/
      BadHint: AugmentedError<ApiType>;
    };
    forum: {
      /**
       * Account does not match post author.
       **/
      AccountDoesNotMatchPostAuthor: AugmentedError<ApiType>;
      /**
       * Thread not authored by the given user.
       **/
      AccountDoesNotMatchThreadAuthor: AugmentedError<ApiType>;
      /**
       * Forum user has already voted.
       **/
      AlreadyVotedOnPoll: AugmentedError<ApiType>;
      /**
       * Ancestor category immutable, i.e. deleted or archived
       **/
      AncestorCategoryImmutable: AugmentedError<ApiType>;
      /**
       * Category does not exist.
       **/
      CategoryDoesNotExist: AugmentedError<ApiType>;
      /**
       * Provided moderator is not given category moderator
       **/
      CategoryModeratorDoesNotExist: AugmentedError<ApiType>;
      /**
       * Category not being updated.
       **/
      CategoryNotBeingUpdated: AugmentedError<ApiType>;
      /**
       * Category still contains some subcategories.
       **/
      CategoryNotEmptyCategories: AugmentedError<ApiType>;
      /**
       * Category still contains some threads.
       **/
      CategoryNotEmptyThreads: AugmentedError<ApiType>;
      /**
       * data migration not done yet.
       **/
      DataMigrationNotDone: AugmentedError<ApiType>;
      /**
       * Forum user id not match its account.
       **/
      ForumUserIdNotMatchAccount: AugmentedError<ApiType>;
      /**
       * Not enough balance to post
       **/
      InsufficientBalanceForPost: AugmentedError<ApiType>;
      /**
       * Not enough balance to create thread
       **/
      InsufficientBalanceForThreadCreation: AugmentedError<ApiType>;
      /**
       * Maximum size of storage map exceeded
       **/
      MapSizeLimit: AugmentedError<ApiType>;
      /**
       * Maximum valid category depth exceeded.
       **/
      MaxValidCategoryDepthExceeded: AugmentedError<ApiType>;
      /**
       * No permissions to delete category.
       **/
      ModeratorCantDeleteCategory: AugmentedError<ApiType>;
      /**
       * No permissions to update category.
       **/
      ModeratorCantUpdateCategory: AugmentedError<ApiType>;
      /**
       * Moderator id not match its account.
       **/
      ModeratorIdNotMatchAccount: AugmentedError<ApiType>;
      /**
       * Moderator can't moderate destination category.
       **/
      ModeratorModerateDestinationCategory: AugmentedError<ApiType>;
      /**
       * Moderator can't moderate category containing thread.
       **/
      ModeratorModerateOriginCategory: AugmentedError<ApiType>;
      /**
       * Origin doesn't correspond to any lead account
       **/
      OriginNotForumLead: AugmentedError<ApiType>;
      /**
       * Category path len should be greater than zero
       **/
      PathLengthShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Poll items number too short.
       **/
      PollAlternativesTooShort: AugmentedError<ApiType>;
      /**
       * Poll data committed after poll expired.
       **/
      PollCommitExpired: AugmentedError<ApiType>;
      /**
       * Poll data committed is wrong.
       **/
      PollData: AugmentedError<ApiType>;
      /**
       * Poll not exist.
       **/
      PollNotExist: AugmentedError<ApiType>;
      /**
       * Poll date setting is wrong.
       **/
      PollTimeSetting: AugmentedError<ApiType>;
      /**
       * Post does not exist.
       **/
      PostDoesNotExist: AugmentedError<ApiType>;
      /**
       * Duplicates for the stickied thread id collection.
       **/
      StickiedThreadIdsDuplicates: AugmentedError<ApiType>;
      /**
       * Thread does not exist
       **/
      ThreadDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is the same as the destination.
       **/
      ThreadMoveInvalid: AugmentedError<ApiType>;
      /**
       * Thread not being updated.
       **/
      ThreadNotBeingUpdated: AugmentedError<ApiType>;
    };
    forumWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    gatewayWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    grandpa: {
      /**
       * Attempt to signal GRANDPA change with one already pending.
       **/
      ChangePending: AugmentedError<ApiType>;
      /**
       * A given equivocation report is valid but already previously reported.
       **/
      DuplicateOffenceReport: AugmentedError<ApiType>;
      /**
       * An equivocation proof provided as part of an equivocation report is invalid.
       **/
      InvalidEquivocationProof: AugmentedError<ApiType>;
      /**
       * A key ownership proof provided as part of an equivocation report is invalid.
       **/
      InvalidKeyOwnershipProof: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA pause when the authority set isn't live
       * (either paused or already pending pause).
       **/
      PauseFailed: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA resume when the authority set isn't paused
       * (either live or already pending resume).
       **/
      ResumeFailed: AugmentedError<ApiType>;
      /**
       * Cannot signal forced change so soon after last.
       **/
      TooSoon: AugmentedError<ApiType>;
    };
    imOnline: {
      /**
       * Duplicated heartbeat.
       **/
      DuplicatedHeartbeat: AugmentedError<ApiType>;
      /**
       * Non existent public key.
       **/
      InvalidKey: AugmentedError<ApiType>;
    };
    joystreamUtility: {
      /**
       * Insufficient funds for 'Update Working Group Budget' proposal execution
       **/
      InsufficientFundsForBudgetUpdate: AugmentedError<ApiType>;
      /**
       * Insufficient funds for burning
       **/
      InsufficientFundsForBurn: AugmentedError<ApiType>;
      /**
       * Trying to burn zero tokens
       **/
      ZeroTokensBurn: AugmentedError<ApiType>;
    };
    members: {
      /**
       * Cannot set a referral cut percent value. The limit was exceeded.
       **/
      CannotExceedReferralCutPercentLimit: AugmentedError<ApiType>;
      /**
       * Should be a member to receive invites.
       **/
      CannotTransferInvitesForNotMember: AugmentedError<ApiType>;
      /**
       * Cannot invite a member. The controller account has an existing conflicting lock.
       **/
      ConflictingLock: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Controller account required.
       **/
      ControllerAccountRequired: AugmentedError<ApiType>;
      /**
       * Handle already registered.
       **/
      HandleAlreadyRegistered: AugmentedError<ApiType>;
      /**
       * Handle must be provided during registration.
       **/
      HandleMustBeProvidedDuringRegistration: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * Member profile not found (invalid member id).
       **/
      MemberProfileNotFound: AugmentedError<ApiType>;
      /**
       * Not enough balance to buy membership.
       **/
      NotEnoughBalanceToBuyMembership: AugmentedError<ApiType>;
      /**
       * Not enough invites to perform an operation.
       **/
      NotEnoughInvites: AugmentedError<ApiType>;
      /**
       * Cannot find a membership for a provided referrer id.
       **/
      ReferrerIsNotMember: AugmentedError<ApiType>;
      /**
       * Root account required.
       **/
      RootAccountRequired: AugmentedError<ApiType>;
      /**
       * Staking account has already been confirmed.
       **/
      StakingAccountAlreadyConfirmed: AugmentedError<ApiType>;
      /**
       * Staking account for membership doesn't exist.
       **/
      StakingAccountDoesntExist: AugmentedError<ApiType>;
      /**
       * Staking account is registered for some member.
       **/
      StakingAccountIsAlreadyRegistered: AugmentedError<ApiType>;
      /**
       * Invalid origin.
       **/
      UnsignedOrigin: AugmentedError<ApiType>;
      /**
       * Cannot invite a member. Working group balance is not sufficient to set the default
       * balance.
       **/
      WorkingGroupBudgetIsNotSufficientForInviting: AugmentedError<ApiType>;
      /**
       * Membership working group leader is not set.
       **/
      WorkingGroupLeaderNotSet: AugmentedError<ApiType>;
    };
    membershipWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    operationsWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    proposalsCodex: {
      /**
       * Invalid 'decrease stake proposal' parameter - cannot decrease by zero balance.
       **/
      DecreasingStakeIsZero: AugmentedError<ApiType>;
      /**
       * Insufficient funds for 'Update Working Group Budget' proposal execution
       **/
      InsufficientFundsForBudgetUpdate: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - announcing_period
       **/
      InvalidCouncilElectionParameterAnnouncingPeriod: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - candidacy-limit
       **/
      InvalidCouncilElectionParameterCandidacyLimit: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - council_size
       **/
      InvalidCouncilElectionParameterCouncilSize: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - min_council_stake
       **/
      InvalidCouncilElectionParameterMinCouncilStake: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - min-voting_stake
       **/
      InvalidCouncilElectionParameterMinVotingStake: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - new_term_duration
       **/
      InvalidCouncilElectionParameterNewTermDuration: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - revealing_period
       **/
      InvalidCouncilElectionParameterRevealingPeriod: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - voting_period
       **/
      InvalidCouncilElectionParameterVotingPeriod: AugmentedError<ApiType>;
      /**
       * Invalid balance value for the spending proposal
       **/
      InvalidFundingRequestProposalBalance: AugmentedError<ApiType>;
      /**
       * Invalid number of accounts recieving funding request for 'Funding Request' proposal.
       **/
      InvalidFundingRequestProposalNumberOfAccount: AugmentedError<ApiType>;
      /**
       * Repeated account in 'Funding Request' proposal.
       **/
      InvalidFundingRequestProposalRepeatedAccount: AugmentedError<ApiType>;
      /**
       * Invalid 'set lead proposal' parameter - proposed lead cannot be a councilor
       **/
      InvalidSetLeadParameterCannotBeCouncilor: AugmentedError<ApiType>;
      /**
       * Invalid validator count for the 'set validator count' proposal
       **/
      InvalidValidatorCount: AugmentedError<ApiType>;
      /**
       * Invalid working group budget capacity parameter
       **/
      InvalidWorkingGroupBudgetCapacity: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Provided WASM code for the runtime upgrade proposal is empty
       **/
      RuntimeProposalIsEmpty: AugmentedError<ApiType>;
      /**
       * Provided text for text proposal is empty
       **/
      SignalProposalIsEmpty: AugmentedError<ApiType>;
      /**
       * Invalid 'slash stake proposal' parameter - cannot slash by zero balance.
       **/
      SlashingStakeIsZero: AugmentedError<ApiType>;
    };
    proposalsDiscussion: {
      /**
       * Account can't delete post at the moment
       **/
      CannotDeletePost: AugmentedError<ApiType>;
      /**
       * The thread has Closed mode. And post author doesn't belong to council or allowed members.
       **/
      CannotPostOnClosedThread: AugmentedError<ApiType>;
      /**
       * Account has insufficient balance to create a post
       **/
      InsufficientBalanceForPost: AugmentedError<ApiType>;
      /**
       * Max allowed authors list limit exceeded.
       **/
      MaxWhiteListSizeExceeded: AugmentedError<ApiType>;
      /**
       * Should be thread author or councilor.
       **/
      NotAuthorOrCouncilor: AugmentedError<ApiType>;
      /**
       * Post doesn't exist
       **/
      PostDoesntExist: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Thread doesn't exist
       **/
      ThreadDoesntExist: AugmentedError<ApiType>;
    };
    proposalsEngine: {
      /**
       * The proposal have been already voted on
       **/
      AlreadyVoted: AugmentedError<ApiType>;
      /**
       * The conflicting stake discovered. Cannot stake.
       **/
      ConflictingStakes: AugmentedError<ApiType>;
      /**
       * Description is too long
       **/
      DescriptionIsTooLong: AugmentedError<ApiType>;
      /**
       * Proposal cannot have an empty body
       **/
      EmptyDescriptionProvided: AugmentedError<ApiType>;
      /**
       * Stake cannot be empty with this proposal
       **/
      EmptyStake: AugmentedError<ApiType>;
      /**
       * Proposal cannot have an empty title"
       **/
      EmptyTitleProvided: AugmentedError<ApiType>;
      /**
       * There is not enough balance for a stake.
       **/
      InsufficientBalanceForStake: AugmentedError<ApiType>;
      /**
       * Exact execution block cannot be less than current_block.
       **/
      InvalidExactExecutionBlock: AugmentedError<ApiType>;
      /**
       * Approval threshold cannot be zero
       **/
      InvalidParameterApprovalThreshold: AugmentedError<ApiType>;
      /**
       * Slashing threshold cannot be zero
       **/
      InvalidParameterSlashingThreshold: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Max active proposals number exceeded
       **/
      MaxActiveProposalNumberExceeded: AugmentedError<ApiType>;
      /**
       * Not an author
       **/
      NotAuthor: AugmentedError<ApiType>;
      /**
       * Proposal is finalized already
       **/
      ProposalFinalized: AugmentedError<ApiType>;
      /**
       * Disallow to cancel the proposal if there are any votes on it.
       **/
      ProposalHasVotes: AugmentedError<ApiType>;
      /**
       * The proposal does not exist
       **/
      ProposalNotFound: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Stake differs from the proposal requirements
       **/
      StakeDiffersFromRequired: AugmentedError<ApiType>;
      /**
       * Stake should be empty for this proposal
       **/
      StakeShouldBeEmpty: AugmentedError<ApiType>;
      /**
       * Title is too long
       **/
      TitleIsTooLong: AugmentedError<ApiType>;
      /**
       * Exact execution block cannot be zero.
       **/
      ZeroExactExecutionBlock: AugmentedError<ApiType>;
    };
    referendum: {
      /**
       * Trying to vote multiple time in the same cycle
       **/
      AlreadyVotedThisCycle: AugmentedError<ApiType>;
      /**
       * Origin is invalid
       **/
      BadOrigin: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Account Insufficient Free Balance (now)
       **/
      InsufficientBalanceToStake: AugmentedError<ApiType>;
      /**
       * Insufficient stake provided to cast a vote
       **/
      InsufficientStake: AugmentedError<ApiType>;
      /**
       * Salt and referendum option provided don't correspond to the commitment
       **/
      InvalidReveal: AugmentedError<ApiType>;
      /**
       * Vote for not existing option was revealed
       **/
      InvalidVote: AugmentedError<ApiType>;
      /**
       * Referendum is not running when expected to
       **/
      ReferendumNotRunning: AugmentedError<ApiType>;
      /**
       * Revealing stage is not in progress right now
       **/
      RevealingNotInProgress: AugmentedError<ApiType>;
      /**
       * Salt is too long
       **/
      SaltTooLong: AugmentedError<ApiType>;
      /**
       * Unstaking has been forbidden for the user (at least for now)
       **/
      UnstakingForbidden: AugmentedError<ApiType>;
      /**
       * Invalid time to release the locked stake
       **/
      UnstakingVoteInSameCycle: AugmentedError<ApiType>;
      /**
       * Trying to reveal vote that was not cast
       **/
      VoteNotExisting: AugmentedError<ApiType>;
    };
    session: {
      /**
       * Registered duplicate key.
       **/
      DuplicatedKey: AugmentedError<ApiType>;
      /**
       * Invalid ownership proof.
       **/
      InvalidProof: AugmentedError<ApiType>;
      /**
       * No associated validator ID for account.
       **/
      NoAssociatedValidatorId: AugmentedError<ApiType>;
      /**
       * No keys are associated with this account.
       **/
      NoKeys: AugmentedError<ApiType>;
    };
    staking: {
      /**
       * Stash is already bonded.
       **/
      AlreadyBonded: AugmentedError<ApiType>;
      /**
       * Rewards for this era have already been claimed for this validator.
       **/
      AlreadyClaimed: AugmentedError<ApiType>;
      /**
       * Controller is already paired.
       **/
      AlreadyPaired: AugmentedError<ApiType>;
      /**
       * The call is not allowed at the given time due to restrictions of election period.
       **/
      CallNotAllowed: AugmentedError<ApiType>;
      /**
       * Duplicate index.
       **/
      DuplicateIndex: AugmentedError<ApiType>;
      /**
       * Targets cannot be empty.
       **/
      EmptyTargets: AugmentedError<ApiType>;
      /**
       * Attempting to target a stash that still has funds.
       **/
      FundedTarget: AugmentedError<ApiType>;
      /**
       * Incorrect previous history depth input provided.
       **/
      IncorrectHistoryDepth: AugmentedError<ApiType>;
      /**
       * Incorrect number of slashing spans provided.
       **/
      IncorrectSlashingSpans: AugmentedError<ApiType>;
      /**
       * Can not bond with value less than minimum balance.
       **/
      InsufficientValue: AugmentedError<ApiType>;
      /**
       * Invalid era to reward.
       **/
      InvalidEraToReward: AugmentedError<ApiType>;
      /**
       * Invalid number of nominations.
       **/
      InvalidNumberOfNominations: AugmentedError<ApiType>;
      /**
       * Slash record index out of bounds.
       **/
      InvalidSlashIndex: AugmentedError<ApiType>;
      /**
       * Can not schedule more unlock chunks.
       **/
      NoMoreChunks: AugmentedError<ApiType>;
      /**
       * Not a controller account.
       **/
      NotController: AugmentedError<ApiType>;
      /**
       * Items are not sorted and unique.
       **/
      NotSortedAndUnique: AugmentedError<ApiType>;
      /**
       * Not a stash account.
       **/
      NotStash: AugmentedError<ApiType>;
      /**
       * Can not rebond without unlocking chunks.
       **/
      NoUnlockChunk: AugmentedError<ApiType>;
      /**
       * Error while building the assignment type from the compact. This can happen if an index
       * is invalid, or if the weights _overflow_.
       **/
      OffchainElectionBogusCompact: AugmentedError<ApiType>;
      /**
       * The submitted result has unknown edges that are not among the presented winners.
       **/
      OffchainElectionBogusEdge: AugmentedError<ApiType>;
      /**
       * The election size is invalid.
       **/
      OffchainElectionBogusElectionSize: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators has an edge to which they have not voted on chain.
       **/
      OffchainElectionBogusNomination: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators is not an active nominator on chain.
       **/
      OffchainElectionBogusNominator: AugmentedError<ApiType>;
      /**
       * The claimed score does not match with the one computed from the data.
       **/
      OffchainElectionBogusScore: AugmentedError<ApiType>;
      /**
       * A self vote must only be originated from a validator to ONLY themselves.
       **/
      OffchainElectionBogusSelfVote: AugmentedError<ApiType>;
      /**
       * One of the submitted winners is not an active candidate on chain (index is out of range
       * in snapshot).
       **/
      OffchainElectionBogusWinner: AugmentedError<ApiType>;
      /**
       * Incorrect number of winners were presented.
       **/
      OffchainElectionBogusWinnerCount: AugmentedError<ApiType>;
      /**
       * The submitted result is received out of the open window.
       **/
      OffchainElectionEarlySubmission: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators has an edge which is submitted before the last non-zero
       * slash of the target.
       **/
      OffchainElectionSlashedNomination: AugmentedError<ApiType>;
      /**
       * The submitted result is not as good as the one stored on chain.
       **/
      OffchainElectionWeakSubmission: AugmentedError<ApiType>;
      /**
       * The snapshot data of the current window is missing.
       **/
      SnapshotUnavailable: AugmentedError<ApiType>;
    };
    storageWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    sudo: {
      /**
       * Sender must be the Sudo account
       **/
      RequireSudo: AugmentedError<ApiType>;
    };
    system: {
      /**
       * Failed to extract the runtime version from the new runtime.
       * 
       * Either calling `Core_version` or decoding `RuntimeVersion` failed.
       **/
      FailedToExtractRuntimeVersion: AugmentedError<ApiType>;
      /**
       * The name of specification does not match between the current runtime
       * and the new runtime.
       **/
      InvalidSpecName: AugmentedError<ApiType>;
      /**
       * Suicide called when the account has non-default composite data.
       **/
      NonDefaultComposite: AugmentedError<ApiType>;
      /**
       * There is a non-zero reference count preventing the account from being purged.
       **/
      NonZeroRefCount: AugmentedError<ApiType>;
      /**
       * The specification version is not allowed to decrease between the current runtime
       * and the new runtime.
       **/
      SpecVersionNeedsToIncrease: AugmentedError<ApiType>;
    };
  }

  export interface DecoratedErrors<ApiType extends ApiTypes> extends AugmentedErrors<ApiType> {
  }
}
