// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import { Vec } from '@polkadot/types/codec';
import { u32, u64 } from '@polkadot/types/primitive';
import { ProposalParameters } from './all';
import { Balance, BalanceOf, BlockNumber, LockIdentifier, Moment, Perbill, RuntimeDbWeight, Weight } from '@polkadot/types/interfaces/runtime';
import { SessionIndex } from '@polkadot/types/interfaces/session';
import { EraIndex } from '@polkadot/types/interfaces/staking';
import { WeightToFeeCoefficient } from '@polkadot/types/interfaces/support';
import { ApiTypes } from '@polkadot/api/types';

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
    contentDirectoryWorkingGroup: {
      /**
       * Exports const -  max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
    };
    council: {
      /**
       * Duration of annoncing period
       **/
      announcingPeriodDuration: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Amount that will be added to the budget balance on every refill.
       **/
      budgetRefillAmount: Balance & AugmentedConst<ApiType>;
      /**
       * Interval between automatic budget refills.
       **/
      budgetRefillPeriod: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Council member count
       **/
      councilSize: u64 & AugmentedConst<ApiType>;
      /**
       * The value elected members will be awarded each block of their reign.
       **/
      electedMemberRewardPerBlock: Balance & AugmentedConst<ApiType>;
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
    dataDirectory: {
      /**
       * Maximum objects allowed per inject_data_objects() transaction
       **/
      maxObjectsPerInjection: u32 & AugmentedConst<ApiType>;
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
    forumWorkingGroup: {
      /**
       * Exports const -  max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
    };
    membershipWorkingGroup: {
      /**
       * Exports const -  max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
    };
    proposalsCodex: {
      /**
       * Exports 'Add working group opening' proposal parameters.
       **/
      addWorkingGroupOpeningProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Amend constitution' proposal parameters.
       **/
      amendConstitutionProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Decrease working group leader stake' proposal parameters.
       **/
      decreaseWorkingGroupLeaderStakeProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Fill working group opening' proposal parameters.
       **/
      fillWorkingGroupOpeningProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Runtime upgrade' proposal parameters.
       **/
      runtimeUpgradeProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Set validator count' proposal parameters.
       **/
      setValidatorCountProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Set working group budget capacity' proposal parameters.
       **/
      setWorkingGroupBudgetCapacityProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Set working group leader reward' proposal parameters.
       **/
      setWorkingGroupLeaderRewardProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Slash working group leader stake' proposal parameters.
       **/
      slashWorkingGroupLeaderStakeProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Spending' proposal parameters.
       **/
      spendingProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Terminate working group leader role' proposal parameters.
       **/
      terminateWorkingGroupLeaderRoleProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
      /**
       * Exports 'Text' proposal parameters.
       **/
      textProposalParameters: ProposalParameters & AugmentedConst<ApiType>;
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
       * Exports const -  the fee is applied when the proposal gets rejected. A fee would be slashed (burned).
       **/
      rejectionFee: BalanceOf & AugmentedConst<ApiType>;
      /**
       * Exports const -  max allowed proposal title length.
       **/
      titleMaxLength: u32 & AugmentedConst<ApiType>;
    };
    referendum: {
      /**
       * Identifier for currency locks used for staking.
       **/
      lockId: LockIdentifier & AugmentedConst<ApiType>;
      /**
       * Maximum length of vote commitment salt. Use length that ensures uniqueness for hashing e.g. std::u64::MAX.
       **/
      maxSaltLength: u64 & AugmentedConst<ApiType>;
      /**
       * Minimum stake needed for voting
       **/
      minimumStake: Balance & AugmentedConst<ApiType>;
      /**
       * Duration of revealing stage (number of blocks)
       **/
      revealStageDuration: BlockNumber & AugmentedConst<ApiType>;
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
       * Exports const -  max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: u32 & AugmentedConst<ApiType>;
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
