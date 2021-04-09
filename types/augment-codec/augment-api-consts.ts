// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import { Vec } from '@polkadot/types/codec';
import { u32, u64 } from '@polkadot/types/primitive';
import { MaxNumber } from './all';
import { Balance, BalanceOf, BlockNumber, Moment, Perbill, RuntimeDbWeight, Weight } from '@polkadot/types/interfaces/runtime';
import { SessionIndex } from '@polkadot/types/interfaces/session';
import { EraIndex } from '@polkadot/types/interfaces/staking';
import { WeightToFeeCoefficient } from '@polkadot/types/interfaces/support';

declare module '@polkadot/metadata/Decorated/consts/types' {
  export interface Constants {
    babe: {
      /**
       * The number of **slots** that an epoch takes. We couple sessions to
       * epochs, i.e. we start a new session once the new epoch begins.
       **/
      epochDuration: AugmentedConst<u64>;
      /**
       * The expected average block time at which BABE should be creating
       * blocks. Since BABE is probabilistic it is not trivial to figure out
       * what the expected average block time should be based on the slot
       * duration and the security parameter `c` (where `1 - c` represents
       * the probability of a slot being empty).
       **/
      expectedBlockTime: AugmentedConst<Moment>;
    };
    balances: {
      /**
       * The minimum amount required to keep an account open.
       **/
      existentialDeposit: AugmentedConst<Balance>;
    };
    content: {
      /**
       * Exports const -  max number of curators per group
       **/
      maxNumberOfCuratorsPerGroup: AugmentedConst<MaxNumber>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Exports const -  max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: AugmentedConst<u32>;
    };
    finalityTracker: {
      /**
       * The delay after which point things become suspicious. Default is 1000.
       **/
      reportLatency: AugmentedConst<BlockNumber>;
      /**
       * The number of recent samples to keep from this chain. Default is 101.
       **/
      windowSize: AugmentedConst<BlockNumber>;
    };
    gatewayWorkingGroup: {
      /**
       * Exports const -  max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: AugmentedConst<u32>;
    };
    members: {
      screenedMemberMaxInitialBalance: AugmentedConst<BalanceOf>;
    };
    operationsWorkingGroup: {
      /**
       * Exports const -  max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: AugmentedConst<u32>;
    };
    proposalsCodex: {
      /**
       * Exports max wasm code length of the runtime upgrade proposal const.
       **/
      runtimeUpgradeWasmProposalMaxLength: AugmentedConst<u32>;
      /**
       * Exports max allowed text proposal length const.
       **/
      textProposalMaxLength: AugmentedConst<u32>;
    };
    proposalsDiscussion: {
      /**
       * Exports post edition number limit const.
       **/
      maxPostEditionNumber: AugmentedConst<u32>;
      /**
       * Exports max thread by same author in a row number limit const.
       **/
      maxThreadInARowNumber: AugmentedConst<u32>;
      /**
       * Exports post length limit const.
       **/
      postLengthLimit: AugmentedConst<u32>;
      /**
       * Exports thread title length limit const.
       **/
      threadTitleLengthLimit: AugmentedConst<u32>;
    };
    proposalsEngine: {
      /**
       * Exports const - the fee is applied when cancel the proposal. A fee would be slashed (burned).
       **/
      cancellationFee: AugmentedConst<BalanceOf>;
      /**
       * Exports const -  max allowed proposal description length.
       **/
      descriptionMaxLength: AugmentedConst<u32>;
      /**
       * Exports const -  max simultaneous active proposals number.
       **/
      maxActiveProposalLimit: AugmentedConst<u32>;
      /**
       * Exports const -  the fee is applied when the proposal gets rejected. A fee would be slashed (burned).
       **/
      rejectionFee: AugmentedConst<BalanceOf>;
      /**
       * Exports const -  max allowed proposal title length.
       **/
      titleMaxLength: AugmentedConst<u32>;
    };
    staking: {
      /**
       * Number of eras that staked funds must remain bonded for.
       **/
      bondingDuration: AugmentedConst<EraIndex>;
      /**
       * The number of blocks before the end of the era from which election submissions are allowed.
       * 
       * Setting this to zero will disable the offchain compute and only on-chain seq-phragmen will
       * be used.
       * 
       * This is bounded by being within the last session. Hence, setting it to a value more than the
       * length of a session will be pointless.
       **/
      electionLookahead: AugmentedConst<BlockNumber>;
      /**
       * Maximum number of balancing iterations to run in the offchain submission.
       * 
       * If set to 0, balance_solution will not be executed at all.
       **/
      maxIterations: AugmentedConst<u32>;
      /**
       * The maximum number of nominators rewarded for each validator.
       * 
       * For each validator only the `$MaxNominatorRewardedPerValidator` biggest stakers can claim
       * their reward. This used to limit the i/o cost for the nominator payout.
       **/
      maxNominatorRewardedPerValidator: AugmentedConst<u32>;
      /**
       * The threshold of improvement that should be provided for a new solution to be accepted.
       **/
      minSolutionScoreBump: AugmentedConst<Perbill>;
      /**
       * Number of sessions per era.
       **/
      sessionsPerEra: AugmentedConst<SessionIndex>;
      /**
       * Number of eras that slashes are deferred by, after computation.
       * 
       * This should be less than the bonding duration.
       * Set to 0 if slashes should be applied immediately, without opportunity for
       * intervention.
       **/
      slashDeferDuration: AugmentedConst<EraIndex>;
    };
    storageWorkingGroup: {
      /**
       * Exports const -  max simultaneous active worker number.
       **/
      maxWorkerNumberLimit: AugmentedConst<u32>;
    };
    system: {
      /**
       * The base weight of executing a block, independent of the transactions in the block.
       **/
      blockExecutionWeight: AugmentedConst<Weight>;
      /**
       * The maximum number of blocks to allow in mortal eras.
       **/
      blockHashCount: AugmentedConst<BlockNumber>;
      /**
       * The weight of runtime database operations the runtime can invoke.
       **/
      dbWeight: AugmentedConst<RuntimeDbWeight>;
      /**
       * The base weight of an Extrinsic in the block, independent of the of extrinsic being executed.
       **/
      extrinsicBaseWeight: AugmentedConst<Weight>;
      /**
       * The maximum length of a block (in bytes).
       **/
      maximumBlockLength: AugmentedConst<u32>;
      /**
       * The maximum weight of a block.
       **/
      maximumBlockWeight: AugmentedConst<Weight>;
    };
    timestamp: {
      /**
       * The minimum period between blocks. Beware that this is different to the *expected* period
       * that the block production apparatus provides. Your chosen consensus system will generally
       * work with this to determine a sensible block time. e.g. For Aura, it will be double this
       * period on default settings.
       **/
      minimumPeriod: AugmentedConst<Moment>;
    };
    transactionPayment: {
      /**
       * The fee to be paid for making a transaction; the per-byte portion.
       **/
      transactionByteFee: AugmentedConst<BalanceOf>;
      /**
       * The polynomial that is applied in order to derive fee from weight.
       **/
      weightToFee: AugmentedConst<Vec<WeightToFeeCoefficient>>;
    };
  }
}
