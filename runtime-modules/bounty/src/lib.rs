//! This pallet works with crowd funded bounties that allows a member, or the council, to crowd
//! fund work on projects with a public benefit.
//!
//! ### Bounty stages
//! - Funding - a bounty is being funded.
//! - FundingExpired - a bounty is expired. It can be only canceled.
//! - WorkSubmission - interested participants can submit their work.
//! - Judgment - working periods ended and the oracle should provide their judgment.
//! - SuccessfulBountyWithdrawal - work entrants' stakes and rewards can be withdrawn.
//! - FailedBountyWithdrawal - contributors' funds can be withdrawn along with a split cherry.
//!
//! A detailed description could be found [here](https://github.com/Joystream/joystream/issues/1998).
//!
//! ### Supported extrinsics
//! - [create_bounty](./struct.Module.html#method.create_bounty) - creates a bounty
//!
//! #### Funding stage
//! - [cancel_bounty](./struct.Module.html#method.cancel_bounty) - cancels a bounty
//! - [veto_bounty](./struct.Module.html#method.veto_bounty) - vetoes a bounty
//! - [fund_bounty](./struct.Module.html#method.fund_bounty) - provide funding for a bounty
//!
//! #### FundingExpired stage
//! - [cancel_bounty](./struct.Module.html#method.cancel_bounty) - cancels a bounty
//!
//! #### Work submission stage
//! - [announce_work_entry](./struct.Module.html#method.announce_work_entry) - announce
//! work entry for a successful bounty.
//! - [withdraw_work_entry](./struct.Module.html#method.withdraw_work_entry) - withdraw
//! work entry for a bounty.
//! - [submit_work](./struct.Module.html#method.submit_work) - submit work for a bounty.
//!
//! #### Judgment stage
//! - [submit_oracle_judgment](./struct.Module.html#method.submit_oracle_judgment) - submits an
//! oracle judgment for a bounty.
//!
//! #### SuccessfulBountyWithdrawal stage
//! - [withdraw_work_entrant_funds](./struct.Module.html#method.withdraw_work_entrant_funds) -
//! withdraw work entrant funds.
//!
//! #### FailedBountyWithdrawal stage
//! - [withdraw_funding](./struct.Module.html#method.withdraw_funding) - withdraw
//! funding for a failed bounty.

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(test)]
pub(crate) mod tests;

mod actors;
mod stages;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

/// pallet_bounty WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn create_bounty_by_council(i: u32, j: u32) -> Weight;
    fn create_bounty_by_member(i: u32, j: u32) -> Weight;
    fn cancel_bounty_by_member() -> Weight;
    fn cancel_bounty_by_council() -> Weight;
    fn veto_bounty() -> Weight;
    fn fund_bounty_by_member() -> Weight;
    fn fund_bounty_by_council() -> Weight;
    fn withdraw_funding_by_member() -> Weight;
    fn withdraw_funding_by_council() -> Weight;
    fn announce_work_entry(i: u32) -> Weight;
    fn withdraw_work_entry() -> Weight;
    fn submit_work(i: u32) -> Weight;
    fn submit_oracle_judgment_by_council_all_winners(i: u32) -> Weight;
    fn submit_oracle_judgment_by_council_all_rejected(i: u32) -> Weight;
    fn submit_oracle_judgment_by_member_all_winners(i: u32) -> Weight;
    fn submit_oracle_judgment_by_member_all_rejected(i: u32) -> Weight;
    fn withdraw_work_entrant_funds() -> Weight;
}

type WeightInfoBounty<T> = <T as Trait>::WeightInfo;

pub(crate) use actors::BountyActorManager;
pub(crate) use stages::BountyStageCalculator;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{Currency, ExistenceRequirement, Get, LockIdentifier};
use frame_support::weights::Weight;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
use frame_system::ensure_root;
use sp_arithmetic::traits::{One, Saturating, Zero};
use sp_runtime::{traits::AccountIdConversion, ModuleId};
use sp_runtime::{Perbill, SaturatedConversion};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec::Vec;

use common::council::CouncilBudgetManager;
use common::membership::{
    MemberId, MemberOriginValidator, MembershipInfoProvider, StakingAccountValidator,
};
use staking_handler::StakingHandler;

/// Main pallet-bounty trait.
pub trait Trait:
    frame_system::Trait + balances::Trait + common::membership::MembershipTypes
{
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// The bounty's module id, used for deriving its sovereign account ID.
    type ModuleId: Get<ModuleId>;

    /// Bounty Id type
    type BountyId: From<u32> + Parameter + Default + Copy;

    /// Validates staking account ownership for a member, member ID and origin combination and
    /// providers controller id for a member.
    type Membership: StakingAccountValidator<Self>
        + MembershipInfoProvider<Self>
        + MemberOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Provides an access for the council budget.
    type CouncilBudgetManager: CouncilBudgetManager<BalanceOf<Self>>;

    /// Provides stake logic implementation.
    type StakingHandler: StakingHandler<
        Self::AccountId,
        BalanceOf<Self>,
        MemberId<Self>,
        LockIdentifier,
    >;

    /// Work entry Id type
    type EntryId: From<u32> + Parameter + Default + Copy + Ord + One;

    /// Defines max work entry number for a closed assurance type contract bounty.
    type ClosedContractSizeLimit: Get<u32>;

    /// Defines min cherry for a bounty.
    type MinCherryLimit: Get<BalanceOf<Self>>;

    /// Defines min funding amount for a bounty.
    type MinFundingLimit: Get<BalanceOf<Self>>;

    /// Defines min work entrant stake for a bounty.
    type MinWorkEntrantStake: Get<BalanceOf<Self>>;
}

/// Alias type for the BountyParameters.
pub type BountyCreationParameters<T> = BountyParameters<
    BalanceOf<T>,
    <T as frame_system::Trait>::BlockNumber,
    <T as common::membership::MembershipTypes>::MemberId,
>;

/// Defines who can submit the work.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum AssuranceContractType<MemberId: Ord> {
    /// Anyone can submit the work.
    Open,

    /// Only specific members can submit the work.
    Closed(BTreeSet<MemberId>),
}

impl<MemberId: Ord> Default for AssuranceContractType<MemberId> {
    fn default() -> Self {
        AssuranceContractType::Open
    }
}

/// Defines funding conditions.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum FundingType<BlockNumber, Balance> {
    /// Funding has no time limits.
    Perpetual {
        /// Desired funding.
        target: Balance,
    },

    /// Funding has a time limitation.
    Limited {
        /// Minimum amount of funds for a successful bounty.
        min_funding_amount: Balance,

        /// Upper boundary for a bounty funding.
        max_funding_amount: Balance,

        /// Maximum allowed funding period.
        funding_period: BlockNumber,
    },
}

impl<BlockNumber, Balance: Default> Default for FundingType<BlockNumber, Balance> {
    fn default() -> Self {
        Self::Perpetual {
            target: Default::default(),
        }
    }
}

/// Defines parameters for the bounty creation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct BountyParameters<Balance, BlockNumber, MemberId: Ord> {
    /// Origin that will select winner(s), is either a given member or a council.
    pub oracle: BountyActor<MemberId>,

    /// Contract type defines who can submit the work.
    pub contract_type: AssuranceContractType<MemberId>,

    /// Bounty creator: could be a member or a council.
    pub creator: BountyActor<MemberId>,

    /// An amount of funding provided by the creator which will be split among all other
    /// contributors should the bounty not be successful. If successful, cherry is returned to
    /// the creator. When council is creating bounty, this comes out of their budget, when a member
    /// does it, it comes from an account.
    pub cherry: Balance,

    /// Amount of stake required to enter bounty as entrant.
    pub entrant_stake: Balance,

    /// Defines parameters for different funding types.
    pub funding_type: FundingType<BlockNumber, Balance>,

    /// Number of blocks from end of funding period until people can no longer submit
    /// bounty submissions.
    pub work_period: BlockNumber,

    /// Number of block from end of work period until oracle can no longer decide winners.
    pub judging_period: BlockNumber,
}

/// Bounty actor to perform operations for a bounty.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum BountyActor<MemberId> {
    /// Council performs operations for a bounty.
    Council,

    /// Member performs operations for a bounty.
    Member(MemberId),
}

impl<MemberId> Default for BountyActor<MemberId> {
    fn default() -> Self {
        BountyActor::Council
    }
}

/// Defines current bounty stage.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy)]
pub enum BountyStage {
    /// Bounty funding stage.
    Funding {
        /// Bounty has already some contributions.
        has_contributions: bool,
    },

    /// Bounty funding period expired with no contributions.
    FundingExpired,

    /// A bounty has gathered necessary funds and ready to accept work submissions.
    WorkSubmission,

    /// Working periods ended and the oracle should provide their judgment.
    Judgment,

    /// Indicates a withdrawal on bounty success. Workers get rewards and their stake.
    SuccessfulBountyWithdrawal,

    /// Indicates a withdrawal on bounty failure. Workers get their stake back. Funders
    /// get their contribution back as well as part of the cherry.
    FailedBountyWithdrawal,
}

/// Defines current bounty state.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum BountyMilestone<BlockNumber> {
    /// Bounty was created at given block number.
    /// Boolean value defines whether the bounty has some funding contributions.
    Created {
        /// Bounty creation block.
        created_at: BlockNumber,
        /// Bounty has already some contributions.
        has_contributions: bool,
    },

    /// A bounty funding was successful and it exceeded max funding amount.
    BountyMaxFundingReached {
        ///  A bounty funding was successful on the provided block.
        max_funding_reached_at: BlockNumber,
    },

    /// Some work was submitted for a bounty.
    WorkSubmitted {
        ///  Starting block for the work period.
        work_period_started_at: BlockNumber,
    },

    /// A judgment was submitted for a bounty.
    JudgmentSubmitted {
        /// The bounty judgment contains at least a single winner.
        successful_bounty: bool,
    },
}

impl<BlockNumber: Default> Default for BountyMilestone<BlockNumber> {
    fn default() -> Self {
        BountyMilestone::Created {
            created_at: Default::default(),
            has_contributions: false,
        }
    }
}

/// Alias type for the Bounty.
pub type Bounty<T> = BountyRecord<
    BalanceOf<T>,
    <T as frame_system::Trait>::BlockNumber,
    <T as common::membership::MembershipTypes>::MemberId,
>;

/// Crowdfunded bounty record.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct BountyRecord<Balance, BlockNumber, MemberId: Ord> {
    /// Bounty creation parameters.
    pub creation_params: BountyParameters<Balance, BlockNumber, MemberId>,

    /// Total funding balance reached so far.
    /// Includes initial funding by a creator and other members funding.
    pub total_funding: Balance,

    /// Bounty current milestone(state). It represents fact known about the bounty, eg.:
    /// it was canceled or max funding amount was reached.
    pub milestone: BountyMilestone<BlockNumber>,

    /// Current active work entry counter.
    pub active_work_entry_count: u32,
}

impl<Balance: PartialOrd + Clone, BlockNumber: Clone, MemberId: Ord>
    BountyRecord<Balance, BlockNumber, MemberId>
{
    // Increments bounty active work entry counter.
    fn increment_active_work_entry_counter(&mut self) {
        self.active_work_entry_count += 1;
    }

    // Decrements bounty active work entry counter. Nothing happens on zero counter.
    fn decrement_active_work_entry_counter(&mut self) {
        if self.active_work_entry_count > 0 {
            self.active_work_entry_count -= 1;
        }
    }

    // Defines whether the maximum funding amount will be reached for the current funding type.
    fn is_maximum_funding_reached(&self, total_funding: Balance) -> bool {
        match self.creation_params.funding_type {
            FundingType::Perpetual { ref target } => total_funding >= *target,
            FundingType::Limited {
                ref max_funding_amount,
                ..
            } => total_funding >= *max_funding_amount,
        }
    }

    // Returns the maximum funding amount for the current funding type.
    pub(crate) fn maximum_funding(&self) -> Balance {
        match self.creation_params.funding_type.clone() {
            FundingType::Perpetual { target } => target,
            FundingType::Limited {
                max_funding_amount, ..
            } => max_funding_amount,
        }
    }
}

/// Alias type for the Entry.
pub type Entry<T> = EntryRecord<
    <T as frame_system::Trait>::AccountId,
    <T as common::membership::MembershipTypes>::MemberId,
    <T as frame_system::Trait>::BlockNumber,
    BalanceOf<T>,
>;

/// Work entry.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct EntryRecord<AccountId, MemberId, BlockNumber, Balance> {
    /// Work entrant member ID.
    pub member_id: MemberId,

    /// Account ID for staking lock.
    pub staking_account_id: AccountId,

    /// Work entry submission block.
    pub submitted_at: BlockNumber,

    /// Signifies that an entry has at least one submitted work.
    pub work_submitted: bool,

    /// Optional oracle judgment for the work entry.
    /// Absent value means neither winner nor rejected entry - "legitimate user" that gets their
    /// stake back without slashing but doesn't get a reward.
    pub oracle_judgment_result: Option<OracleWorkEntryJudgment<Balance>>,
}

/// Defines the oracle judgment for the work entry.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy)]
pub enum OracleWorkEntryJudgment<Balance> {
    /// The work entry is selected as a winner.
    Winner { reward: Balance },

    /// The work entry is considered harmful. The stake will be slashed.
    Rejected,
}

impl<Balance> Default for OracleWorkEntryJudgment<Balance> {
    fn default() -> Self {
        Self::Rejected
    }
}

impl<Balance> OracleWorkEntryJudgment<Balance> {
    // Work entry judgment helper. Returns true for winners.
    pub(crate) fn is_winner(&self) -> bool {
        matches!(*self, Self::Winner { .. })
    }
}

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

// Entrant stake helper struct.
struct RequiredStakeInfo<T: Trait> {
    // stake amount
    amount: BalanceOf<T>,
    // staking_account_id
    account_id: T::AccountId,
}

/// An alias for the OracleJudgment.
pub type OracleJudgmentOf<T> = OracleJudgment<<T as Trait>::EntryId, BalanceOf<T>>;

/// The collection of the oracle judgments for the work entries.
pub type OracleJudgment<EntryId, Balance> = BTreeMap<EntryId, OracleWorkEntryJudgment<Balance>>;

decl_storage! {
    trait Store for Module<T: Trait> as Bounty {
        /// Bounty storage.
        pub Bounties get(fn bounties) : map hasher(blake2_128_concat) T::BountyId => Bounty<T>;

        /// Double map for bounty funding. It stores a member or council funding for bounties.
        pub BountyContributions get(fn contribution_by_bounty_by_actor): double_map
            hasher(blake2_128_concat) T::BountyId,
            hasher(blake2_128_concat) BountyActor<MemberId<T>> => BalanceOf<T>;

        /// Count of all bounties that have been created.
        pub BountyCount get(fn bounty_count): u32;

        /// Work entry storage map.
        pub Entries get(fn entries): map hasher(blake2_128_concat) T::EntryId => Entry<T>;

        /// Count of all work entries that have been created.
        pub EntryCount get(fn entry_count): u32;
    }
}

decl_event! {
    pub enum Event<T>
    where
        <T as Trait>::BountyId,
        <T as Trait>::EntryId,
        Balance = BalanceOf<T>,
        MemberId = MemberId<T>,
        <T as frame_system::Trait>::AccountId,
        BountyCreationParameters = BountyCreationParameters<T>,
        OracleJudgment = OracleJudgmentOf<T>,
    {
        /// A bounty was created.
        /// Params:
        /// - bounty ID
        /// - creation parameters
        /// - bounty metadata
        BountyCreated(BountyId, BountyCreationParameters, Vec<u8>),

        /// A bounty was canceled.
        /// Params:
        /// - bounty ID
        /// - bounty creator
        BountyCanceled(BountyId, BountyActor<MemberId>),

        /// A bounty was vetoed.
        /// Params:
        /// - bounty ID
        BountyVetoed(BountyId),

        /// A bounty was funded by a member or a council.
        /// Params:
        /// - bounty ID
        /// - bounty funder
        /// - funding amount
        BountyFunded(BountyId, BountyActor<MemberId>, Balance),

        /// A bounty has reached its maximum funding amount.
        /// Params:
        /// - bounty ID
        BountyMaxFundingReached(BountyId),

        /// A member or a council has withdrawn the funding.
        /// Params:
        /// - bounty ID
        /// - bounty funder
        BountyFundingWithdrawal(BountyId, BountyActor<MemberId>),

        /// A bounty creator has withdrawn the cherry (member or council).
        /// Params:
        /// - bounty ID
        /// - bounty creator
        BountyCreatorCherryWithdrawal(BountyId, BountyActor<MemberId>),

        /// A bounty was removed.
        /// Params:
        /// - bounty ID
        BountyRemoved(BountyId),

        /// Work entry was announced.
        /// Params:
        /// - bounty ID
        /// - created entry ID
        /// - entrant member ID
        /// - staking account ID
        WorkEntryAnnounced(BountyId, EntryId, MemberId, AccountId),

        /// Work entry was withdrawn.
        /// Params:
        /// - bounty ID
        /// - entry ID
        /// - entrant member ID
        WorkEntryWithdrawn(BountyId, EntryId, MemberId),

        /// Work entry was slashed.
        /// Params:
        /// - bounty ID
        /// - entry ID
        WorkEntrySlashed(BountyId, EntryId),

        /// Submit work.
        /// Params:
        /// - bounty ID
        /// - created entry ID
        /// - entrant member ID
        /// - work data (description, URL, BLOB, etc.)
        WorkSubmitted(BountyId, EntryId, MemberId, Vec<u8>),

        /// Submit oracle judgment.
        /// Params:
        /// - bounty ID
        /// - oracle
        /// - judgment data
        /// - rationale
        OracleJudgmentSubmitted(BountyId, BountyActor<MemberId>, OracleJudgment, Vec<u8>),

        /// Work entry was slashed.
        /// Params:
        /// - bounty ID
        /// - entry ID
        /// - entrant member ID
        WorkEntrantFundsWithdrawn(BountyId, EntryId, MemberId),
    }
}

decl_error! {
    /// Bounty pallet predefined errors
    pub enum Error for Module<T: Trait> {
        /// Min funding amount cannot be greater than max amount.
        MinFundingAmountCannotBeGreaterThanMaxAmount,

        /// Bounty doesnt exist.
        BountyDoesntExist,

        /// Operation can be performed only by a bounty creator.
        NotBountyActor,

        /// Work period cannot be zero.
        WorkPeriodCannotBeZero,

        /// Judging period cannot be zero.
        JudgingPeriodCannotBeZero,

        /// Unexpected bounty stage for an operation: Funding.
        InvalidStageUnexpectedFunding,

        /// Unexpected bounty stage for an operation: FundingExpired.
        InvalidStageUnexpectedFundingExpired,

        /// Unexpected bounty stage for an operation: WorkSubmission.
        InvalidStageUnexpectedWorkSubmission,

        /// Unexpected bounty stage for an operation: Judgment.
        InvalidStageUnexpectedJudgment,

        /// Unexpected bounty stage for an operation: SuccessfulBountyWithdrawal.
        InvalidStageUnexpectedSuccessfulBountyWithdrawal,

        /// Unexpected bounty stage for an operation: FailedBountyWithdrawal.
        InvalidStageUnexpectedFailedBountyWithdrawal,

        /// Insufficient balance for a bounty cherry.
        InsufficientBalanceForBounty,

        /// Funding period is not expired for the bounty.
        FundingPeriodNotExpired,

        /// Cannot found bounty contribution.
        NoBountyContributionFound,

        /// There is nothing to withdraw.
        NothingToWithdraw,

        /// Incorrect funding amount.
        ZeroFundingAmount,

        /// There is not enough balance for a stake.
        InsufficientBalanceForStake,

        /// The conflicting stake discovered. Cannot stake.
        ConflictingStakes,

        /// Work entry doesnt exist.
        WorkEntryDoesntExist,

        /// Cannot add work entry because of the limit.
        MaxWorkEntryLimitReached,

        /// Cherry less then minimum allowed.
        CherryLessThenMinimumAllowed,

        /// Funding amount less then minimum allowed.
        FundingLessThenMinimumAllowed,

        /// Incompatible assurance contract type for a member: cannot submit work to the 'closed
        /// assurance' bounty contract.
        CannotSubmitWorkToClosedContractBounty,

        /// Cannot create a 'closed assurance contract' bounty with empty member list.
        ClosedContractMemberListIsEmpty,

        /// Cannot create a 'closed assurance contract' bounty with member list larger
        /// than allowed max work entry limit.
        ClosedContractMemberListIsTooLarge,

        /// Staking account doesn't belong to a member.
        InvalidStakingAccountForMember,

        /// Cannot set zero reward for winners.
        ZeroWinnerReward,

        /// The total reward for winners should be equal to total bounty funding.
        TotalRewardShouldBeEqualToTotalFunding,

        /// Cannot create a bounty with an entrant stake is less than required minimum.
        EntrantStakeIsLessThanMininum,

        /// Cannot create a bounty with zero funding amount parameter.
        FundingAmountCannotBeZero,

        /// Cannot create a bounty with zero funding period parameter.
        FundingPeriodCannotBeZero,

        /// Cannot submit a judgment without active work entries. A probable case for an error:
        /// an entry with a single submission for a bounty was withdrawn.
        NoActiveWorkEntries,

        /// Invalid judgment - all winners should have work submissions.
        WinnerShouldHasWorkSubmission,
    }
}

decl_module! {
    /// Bounty pallet Substrate Module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

        /// Exports const - max work entry number for a closed assurance type contract bounty.
        const ClosedContractSizeLimit: u32 = T::ClosedContractSizeLimit::get();

        /// Exports const - min cherry value limit for a bounty.
        const MinCherryLimit: BalanceOf<T> = T::MinCherryLimit::get();

        /// Exports const - min funding amount limit for a bounty.
        const MinFundingLimit: BalanceOf<T> = T::MinFundingLimit::get();

        /// Exports const - min work entrant stake for a bounty.
        const MinWorkEntrantStake: BalanceOf<T> = T::MinWorkEntrantStake::get();

        /// Exports const - bounty lock id.
        const BountyLockId: LockIdentifier = T::StakingHandler::lock_id();

        /// Creates a bounty. Metadata stored in the transaction log but discarded after that.
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the _metadata length.
        /// - `M` is closed contract member list length.
        /// - DB:
        ///    - O(M) (O(1) on open contract)
        /// # </weight>
        #[weight = Module::<T>::create_bounty_weight(&params, &metadata)]
        pub fn create_bounty(origin, params: BountyCreationParameters<T>, metadata: Vec<u8>) {
            let bounty_creator_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                params.creator.clone()
            )?;

            Self::ensure_create_bounty_parameters_valid(&params)?;

            bounty_creator_manager.validate_balance_sufficiency(params.cherry)?;

            //
            // == MUTATION SAFE ==
            //

            let next_bounty_count_value = Self::bounty_count() + 1;
            let bounty_id = T::BountyId::from(next_bounty_count_value);

            bounty_creator_manager.transfer_funds_to_bounty_account(bounty_id, params.cherry)?;

            let created_bounty_milestone = BountyMilestone::Created {
                created_at: Self::current_block(),
                has_contributions: false, // just created - no contributions
            };

            let bounty = Bounty::<T> {
                total_funding: Zero::zero(),
                creation_params: params.clone(),
                milestone: created_bounty_milestone,
                active_work_entry_count: 0,
            };

            <Bounties<T>>::insert(bounty_id, bounty);
            BountyCount::mutate(|count| {
                *count = next_bounty_count_value
            });
            Self::deposit_event(RawEvent::BountyCreated(bounty_id, params, metadata));
        }

        /// Cancels a bounty.
        /// It returns a cherry to creator and removes bounty.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::cancel_bounty_by_member()
              .max(WeightInfoBounty::<T>::cancel_bounty_by_council())]
        pub fn cancel_bounty(origin, creator: BountyActor<MemberId<T>>, bounty_id: T::BountyId) {
            let bounty_creator_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                creator.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            bounty_creator_manager.validate_actor(&bounty.creation_params.creator)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage_for_canceling(current_bounty_stage)?;

            //
            // == MUTATION SAFE ==
            //

            Self::return_bounty_cherry_to_creator(bounty_id, &bounty)?;

            Self::remove_bounty(&bounty_id);

            Self::deposit_event(RawEvent::BountyCanceled(bounty_id, creator));
        }

        /// Vetoes a bounty.
        /// It returns a cherry to creator and removes bounty.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::veto_bounty()]
        pub fn veto_bounty(origin, bounty_id: T::BountyId) {
            ensure_root(origin)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(
                current_bounty_stage,
                BountyStage::Funding { has_contributions: false }
            )?;

            //
            // == MUTATION SAFE ==
            //

            Self::return_bounty_cherry_to_creator(bounty_id, &bounty)?;

            Self::remove_bounty(&bounty_id);

            Self::deposit_event(RawEvent::BountyVetoed(bounty_id));
        }

        /// Provides bounty funding.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::fund_bounty_by_member()
              .max(WeightInfoBounty::<T>::fund_bounty_by_council())]
        pub fn fund_bounty(
            origin,
            funder: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
            amount: BalanceOf<T>
        ) {
            let bounty_funder_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                funder.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            ensure!(amount > Zero::zero(), Error::<T>::ZeroFundingAmount);

            ensure!(amount >= T::MinFundingLimit::get(), Error::<T>::FundingLessThenMinimumAllowed);

            bounty_funder_manager.validate_balance_sufficiency(amount)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::Funding{..}),
                Self::unexpected_bounty_stage_error(current_bounty_stage),
            );

            //
            // == MUTATION SAFE ==
            //

            let maximum_funding_reached = bounty.is_maximum_funding_reached(
                bounty.total_funding.saturating_add(amount)
            );

            //
            let actual_funding = if maximum_funding_reached {
                bounty.maximum_funding().saturating_sub(bounty.total_funding)
            } else {
                amount
            };

            bounty_funder_manager.transfer_funds_to_bounty_account(bounty_id, actual_funding)?;


            let new_milestone = Self::get_bounty_milestone_on_funding(
                    maximum_funding_reached,
                    bounty.milestone
            );

            // Update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.total_funding = bounty.total_funding.saturating_add(actual_funding);
                bounty.milestone = new_milestone;
            });

            // Update member funding record checking previous funding.
            let funds_so_far = Self::contribution_by_bounty_by_actor(bounty_id, &funder);
            let total_funding = funds_so_far.saturating_add(actual_funding);
            <BountyContributions<T>>::insert(bounty_id, funder.clone(), total_funding);

            // Fire events.
            Self::deposit_event(RawEvent::BountyFunded(bounty_id, funder, actual_funding));
            if  maximum_funding_reached{
                Self::deposit_event(RawEvent::BountyMaxFundingReached(bounty_id));
            }
        }

        /// Withdraw bounty funding by a member or a council.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::withdraw_funding_by_member()
              .max(WeightInfoBounty::<T>::withdraw_funding_by_council())]
        pub fn withdraw_funding(
            origin,
            funder: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
        ) {
            let bounty_funder_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                funder.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::FailedBountyWithdrawal)?;

            ensure!(
                <BountyContributions<T>>::contains_key(&bounty_id, &funder),
                Error::<T>::NoBountyContributionFound,
            );

            let funding_amount = <BountyContributions<T>>::get(&bounty_id, &funder);
            let cherry_fraction = Self::get_cherry_fraction_for_member(&bounty, funding_amount);
            let withdrawal_amount = funding_amount + cherry_fraction;

            //
            // == MUTATION SAFE ==
            //

            bounty_funder_manager.transfer_funds_from_bounty_account(bounty_id, withdrawal_amount)?;

            <BountyContributions<T>>::remove(&bounty_id, &funder);

            Self::deposit_event(RawEvent::BountyFundingWithdrawal(bounty_id, funder));

            if Self::withdrawal_completed(&current_bounty_stage, &bounty_id) {
                Self::remove_bounty(&bounty_id);
            }
        }


        /// Announce work entry for a successful bounty.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::announce_work_entry(T::ClosedContractSizeLimit::get()
            .saturated_into())]
        pub fn announce_work_entry(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            staking_account_id: T::AccountId,
        ) {
            T::Membership::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::WorkSubmission)?;

            let stake = Self::validate_entrant_stake(
                member_id,
                &bounty,
                staking_account_id.clone()
            )?;

            Self::ensure_valid_contract_type(&bounty, &member_id)?;

            //
            // == MUTATION SAFE ==
            //

            let next_entry_count_value = Self::entry_count() + 1;
            let entry_id = T::EntryId::from(next_entry_count_value);

            // Lock stake balance for bounty if the stake is required.
            if let Some(stake) = stake {
                T::StakingHandler::lock(&stake.account_id, stake.amount);
            }

            let entry = Entry::<T> {
                member_id,
                staking_account_id: staking_account_id.clone(),
                submitted_at: Self::current_block(),
                work_submitted: false,
                oracle_judgment_result: None,
            };

            <Entries<T>>::insert(entry_id, entry);
            EntryCount::mutate(|count| {
                *count = next_entry_count_value
            });

            // Increment work entry counter and update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.increment_active_work_entry_counter();
            });

            Self::deposit_event(RawEvent::WorkEntryAnnounced(
                bounty_id,
                entry_id,
                member_id,
                staking_account_id,
            ));
        }

        /// Withdraw work entry for a bounty. Existing stake could be partially slashed.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::withdraw_work_entry()]
        pub fn withdraw_work_entry(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            entry_id: T::EntryId,
        ) {
            T::Membership::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::WorkSubmission)?;

            let entry = Self::ensure_work_entry_exists(&entry_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::unlock_work_entry_stake_with_possible_penalty(&bounty, &entry);

            Self::remove_work_entry(&bounty_id, &entry_id);

            Self::deposit_event(RawEvent::WorkEntryWithdrawn(bounty_id, entry_id, member_id));
        }

        /// Submit work for a bounty.
        /// # <weight>
        ///
        /// ## weight
        /// `O (N)`
        /// - `N` is the work_data length,
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight =  WeightInfoBounty::<T>::submit_work(work_data.len().saturated_into())]
        pub fn submit_work(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            entry_id: T::EntryId,
            work_data: Vec<u8>
        ) {
            T::Membership::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::WorkSubmission)?;

            Self::ensure_work_entry_exists(&entry_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update entry
            <Entries<T>>::mutate(entry_id, |entry| {
                entry.work_submitted = true;
            });

            let new_milestone = Self::get_bounty_milestone_on_work_submitting(&bounty);

            // Update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.milestone = new_milestone;
            });

            Self::deposit_event(RawEvent::WorkSubmitted(bounty_id, entry_id, member_id, work_data));
        }

        /// Submits an oracle judgment for a bounty.
        /// # <weight>
        ///
        /// ## weight
        /// `O (N)`
        /// - `N` is the work_data length,
        /// - db:
        ///    - `O(N)`
        /// # </weight>
        #[weight = Module::<T>::submit_oracle_judgement_weight(&judgment)]
        pub fn submit_oracle_judgment(
            origin,
            oracle: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
            judgment: OracleJudgment<T::EntryId, BalanceOf<T>>,
            rationale: Vec<u8>,
        ) {
            let bounty_oracle_manager = BountyActorManager::<T>::ensure_bounty_actor_manager(
                origin,
                oracle.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            bounty_oracle_manager.validate_actor(&bounty.creation_params.oracle)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            Self::ensure_bounty_stage(current_bounty_stage, BountyStage::Judgment)?;

            ensure!(bounty.active_work_entry_count != 0, Error::<T>::NoActiveWorkEntries);

            Self::validate_judgment(&bounty, &judgment)?;

            // Lookup for any winners in the judgment.
            let successful_bounty = Self::judgment_has_winners(&judgment);

            //
            // == MUTATION SAFE ==
            //

            // Return a cherry to a creator.
            if successful_bounty {
                Self::return_bounty_cherry_to_creator(bounty_id, &bounty)?;
            }

            // Update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.milestone = BountyMilestone::JudgmentSubmitted {
                    successful_bounty
                };
            });

            // Judgments triage.
            for (entry_id, work_entry_judgment) in judgment.iter() {
                // Update work entries for winners.
                if matches!(*work_entry_judgment, OracleWorkEntryJudgment::Winner{ .. }) {
                    <Entries<T>>::mutate(entry_id, |entry| {
                        entry.oracle_judgment_result = Some(*work_entry_judgment);
                    });
                } else {
                    let entry = Self::entries(entry_id);

                    Self::slash_work_entry_stake(&entry);

                    Self::remove_work_entry(&bounty_id, &entry_id);

                    Self::deposit_event(RawEvent::WorkEntrySlashed(bounty_id, *entry_id));
                }
            }

            // Fire a judgment event.
            Self::deposit_event(RawEvent::OracleJudgmentSubmitted(
                bounty_id,
                oracle,
                judgment,
                rationale,
            ));
        }

        /// Withdraw work entrant funds.
        /// Both legitimate participants and winners get their stake unlocked. Winners also get a
        /// bounty reward.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::withdraw_work_entrant_funds()]
        pub fn withdraw_work_entrant_funds(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            entry_id: T::EntryId,
        ) {
            let controller_account_id =
                T::Membership::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            // Ensure withdrawal for successful or failed bounty.
            ensure!(
                current_bounty_stage == BountyStage::FailedBountyWithdrawal ||
                current_bounty_stage == BountyStage::SuccessfulBountyWithdrawal,
                Self::unexpected_bounty_stage_error(current_bounty_stage)
            );

            let entry = Self::ensure_work_entry_exists(&entry_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Claim the winner reward.
            if let Some(OracleWorkEntryJudgment::Winner { reward }) = entry.oracle_judgment_result {
                Self::transfer_funds_from_bounty_account(
                    &controller_account_id,
                    bounty_id,
                    reward
                )?;
            }

            // Unstake the full work entry state.
            T::StakingHandler::unlock(&entry.staking_account_id);

            // Delete the work entry record from the storage.
            Self::remove_work_entry(&bounty_id, &entry_id);

            // Fire an event.
            Self::deposit_event(RawEvent::WorkEntrantFundsWithdrawn(bounty_id, entry_id, member_id));

            // Remove the bounty in case of the last withdrawal operation.
            if Self::withdrawal_completed(&current_bounty_stage, &bounty_id) {
                Self::remove_bounty(&bounty_id);
            }
        }
    }
}

impl<T: Trait> Module<T> {
    // Wrapper-function over System::block_number()
    pub(crate) fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
    }

    // Validates parameters for a bounty creation.
    fn ensure_create_bounty_parameters_valid(
        params: &BountyCreationParameters<T>,
    ) -> DispatchResult {
        ensure!(
            params.work_period != Zero::zero(),
            Error::<T>::WorkPeriodCannotBeZero
        );

        ensure!(
            params.judging_period != Zero::zero(),
            Error::<T>::JudgingPeriodCannotBeZero
        );

        match params.funding_type {
            FundingType::Perpetual { target } => {
                ensure!(
                    target != Zero::zero(),
                    Error::<T>::FundingAmountCannotBeZero
                );
            }
            FundingType::Limited {
                min_funding_amount,
                max_funding_amount,
                funding_period,
            } => {
                ensure!(
                    min_funding_amount != Zero::zero(),
                    Error::<T>::FundingAmountCannotBeZero
                );

                ensure!(
                    max_funding_amount != Zero::zero(),
                    Error::<T>::FundingAmountCannotBeZero
                );

                ensure!(
                    funding_period != Zero::zero(),
                    Error::<T>::FundingPeriodCannotBeZero
                );

                ensure!(
                    min_funding_amount <= max_funding_amount,
                    Error::<T>::MinFundingAmountCannotBeGreaterThanMaxAmount
                );
            }
        }

        ensure!(
            params.cherry >= T::MinCherryLimit::get(),
            Error::<T>::CherryLessThenMinimumAllowed
        );

        ensure!(
            params.entrant_stake >= T::MinWorkEntrantStake::get(),
            Error::<T>::EntrantStakeIsLessThanMininum
        );

        if let AssuranceContractType::Closed(ref member_ids) = params.contract_type {
            ensure!(
                !member_ids.is_empty(),
                Error::<T>::ClosedContractMemberListIsEmpty
            );

            ensure!(
                member_ids.len() <= T::ClosedContractSizeLimit::get().saturated_into(),
                Error::<T>::ClosedContractMemberListIsTooLarge
            );
        }

        Ok(())
    }

    // Verifies that member balance is sufficient for a bounty.
    fn check_balance_for_account(amount: BalanceOf<T>, account_id: &T::AccountId) -> bool {
        balances::Module::<T>::usable_balance(account_id) >= amount
    }

    // Transfer funds from the member account to the bounty account.
    fn transfer_funds_to_bounty_account(
        account_id: &T::AccountId,
        bounty_id: T::BountyId,
        amount: BalanceOf<T>,
    ) -> DispatchResult {
        let bounty_account_id = Self::bounty_account_id(bounty_id);

        <balances::Module<T> as Currency<T::AccountId>>::transfer(
            account_id,
            &bounty_account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    // Transfer funds from the bounty account to the member account.
    fn transfer_funds_from_bounty_account(
        account_id: &T::AccountId,
        bounty_id: T::BountyId,
        amount: BalanceOf<T>,
    ) -> DispatchResult {
        let bounty_account_id = Self::bounty_account_id(bounty_id);

        <balances::Module<T> as Currency<T::AccountId>>::transfer(
            &bounty_account_id,
            account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    // Verifies bounty existence and retrieves a bounty from the storage.
    fn ensure_bounty_exists(bounty_id: &T::BountyId) -> Result<Bounty<T>, DispatchError> {
        ensure!(
            <Bounties<T>>::contains_key(bounty_id),
            Error::<T>::BountyDoesntExist
        );

        let bounty = <Bounties<T>>::get(bounty_id);

        Ok(bounty)
    }

    // Calculate cherry fraction to reward member for an unsuccessful bounty.
    // Cherry fraction = cherry * (member funding / total funding).
    fn get_cherry_fraction_for_member(
        bounty: &Bounty<T>,
        funding_amount: BalanceOf<T>,
    ) -> BalanceOf<T> {
        let funding_share =
            Perbill::from_rational_approximation(funding_amount, bounty.total_funding);

        // cherry share
        funding_share * bounty.creation_params.cherry
    }

    // Remove bounty and all related info from the storage.
    fn remove_bounty(bounty_id: &T::BountyId) {
        <Bounties<T>>::remove(bounty_id);
        <BountyContributions<T>>::remove_prefix(bounty_id);

        // Slash remaining funds.
        let bounty_account_id = Self::bounty_account_id(*bounty_id);
        let all = balances::Module::<T>::usable_balance(&bounty_account_id);
        if all != Zero::zero() {
            let _ = balances::Module::<T>::slash(&bounty_account_id, all);
        }

        Self::deposit_event(RawEvent::BountyRemoved(*bounty_id));
    }

    // Verifies that the bounty has no pending fund withdrawals left.
    fn withdrawal_completed(stage: &BountyStage, bounty_id: &T::BountyId) -> bool {
        let has_no_contributions = !Self::contributions_exist(bounty_id);
        let has_no_work_entries = !Self::work_entries_exist(bounty_id);

        match stage {
            BountyStage::SuccessfulBountyWithdrawal => {
                // All work entrants withdrew their stakes and rewards.
                has_no_work_entries
            }
            BountyStage::FailedBountyWithdrawal => {
                // All work entrants withdrew their stakes and all funders withdrew cherry and
                // provided funds.
                has_no_contributions && has_no_work_entries
            }
            // Not withdrawal stage
            _ => false,
        }
    }

    // Verifies that bounty has some contribution to withdraw.
    // Should be O(1) because of the single inner call of the next() function of the iterator.
    pub(crate) fn contributions_exist(bounty_id: &T::BountyId) -> bool {
        <BountyContributions<T>>::iter_prefix_values(bounty_id)
            .peekable()
            .peek()
            .is_some()
    }

    // Verifies that bounty has some work entries to withdraw.
    pub(crate) fn work_entries_exist(bounty_id: &T::BountyId) -> bool {
        Self::bounties(bounty_id).active_work_entry_count > 0
    }

    // The account ID of a bounty account. Tests require AccountID type to be at least u128.
    pub(crate) fn bounty_account_id(bounty_id: T::BountyId) -> T::AccountId {
        T::ModuleId::get().into_sub_account(bounty_id)
    }

    // Calculates bounty milestone on member funding.
    fn get_bounty_milestone_on_funding(
        maximum_funding_reached: bool,
        previous_milestone: BountyMilestone<T::BlockNumber>,
    ) -> BountyMilestone<T::BlockNumber> {
        let now = Self::current_block();

        if maximum_funding_reached {
            // Bounty maximum funding reached.
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at: now,
            }
        // No previous contributions.
        } else if let BountyMilestone::Created {
            created_at,
            has_contributions: false,
        } = previous_milestone
        {
            // The bounty has some contributions now.
            BountyMilestone::Created {
                created_at,
                has_contributions: true,
            }
        } else {
            // No changes.
            previous_milestone
        }
    }

    // Calculates bounty milestone on work submitting.
    fn get_bounty_milestone_on_work_submitting(
        bounty: &Bounty<T>,
    ) -> BountyMilestone<T::BlockNumber> {
        let previous_milestone = bounty.milestone.clone();

        match bounty.milestone.clone() {
            BountyMilestone::Created { created_at, .. } => {
                match bounty.creation_params.funding_type {
                    FundingType::Perpetual { .. } => previous_milestone,
                    FundingType::Limited { funding_period, .. } => BountyMilestone::WorkSubmitted {
                        work_period_started_at: created_at + funding_period,
                    },
                }
            }
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
            } => BountyMilestone::WorkSubmitted {
                work_period_started_at: max_funding_reached_at,
            },
            _ => previous_milestone,
        }
    }

    // Validates stake on announcing the work entry.
    fn validate_entrant_stake(
        member_id: MemberId<T>,
        bounty: &Bounty<T>,
        staking_account_id: T::AccountId,
    ) -> Result<Option<RequiredStakeInfo<T>>, DispatchError> {
        let staking_balance = bounty.creation_params.entrant_stake;

        ensure!(
            T::Membership::is_member_staking_account(&member_id, &staking_account_id),
            Error::<T>::InvalidStakingAccountForMember
        );

        ensure!(
            T::StakingHandler::is_account_free_of_conflicting_stakes(&staking_account_id),
            Error::<T>::ConflictingStakes
        );

        ensure!(
            T::StakingHandler::is_enough_balance_for_stake(&staking_account_id, staking_balance),
            Error::<T>::InsufficientBalanceForStake
        );

        Ok(Some(RequiredStakeInfo {
            amount: staking_balance,
            account_id: staking_account_id,
        }))
    }

    // Verifies work entry existence and retrieves an entry from the storage.
    fn ensure_work_entry_exists(entry_id: &T::EntryId) -> Result<Entry<T>, DispatchError> {
        ensure!(
            <Entries<T>>::contains_key(entry_id),
            Error::<T>::WorkEntryDoesntExist
        );

        let entry = Self::entries(entry_id);

        Ok(entry)
    }

    // Unlocks the work entry stake.
    // It also calculates and slashes the stake on work entry withdrawal.
    // The slashing amount depends on the entry active period.
    fn unlock_work_entry_stake_with_possible_penalty(bounty: &Bounty<T>, entry: &Entry<T>) {
        let staking_account_id = &entry.staking_account_id;

        let now = Self::current_block();
        let staking_balance = bounty.creation_params.entrant_stake;

        let entry_was_active_period = now.saturating_sub(entry.submitted_at);

        let slashing_share = Perbill::from_rational_approximation(
            entry_was_active_period,
            bounty.creation_params.work_period,
        );

        // No more than staking_balance.
        let slashing_amount = (slashing_share * staking_balance).min(staking_balance);

        if slashing_amount > Zero::zero() {
            T::StakingHandler::slash(staking_account_id, Some(slashing_amount));
        }

        T::StakingHandler::unlock(staking_account_id);
    }

    // Slashed the work entry stake.
    fn slash_work_entry_stake(entry: &Entry<T>) {
        T::StakingHandler::slash(&entry.staking_account_id, None);
    }

    // Validates the contract type for a bounty
    fn ensure_valid_contract_type(bounty: &Bounty<T>, member_id: &MemberId<T>) -> DispatchResult {
        if let AssuranceContractType::Closed(ref valid_members) =
            bounty.creation_params.contract_type
        {
            ensure!(
                valid_members.contains(member_id),
                Error::<T>::CannotSubmitWorkToClosedContractBounty
            );
        }

        Ok(())
    }

    // Computes the stage of a bounty based on its creation parameters and the current state.
    pub(crate) fn get_bounty_stage(bounty: &Bounty<T>) -> BountyStage {
        let sc = BountyStageCalculator::<T> {
            now: Self::current_block(),
            bounty,
        };

        sc.get_bounty_stage()
    }

    // Validates oracle judgment.
    fn validate_judgment(bounty: &Bounty<T>, judgment: &OracleJudgmentOf<T>) -> DispatchResult {
        // Total judgment reward accumulator.
        let mut reward_sum_from_judgment: BalanceOf<T> = Zero::zero();

        // Validate all work entry judgements.
        for (entry_id, work_entry_judgment) in judgment.iter() {
            if let OracleWorkEntryJudgment::Winner { reward } = work_entry_judgment {
                // Check for zero reward.
                ensure!(*reward != Zero::zero(), Error::<T>::ZeroWinnerReward);

                reward_sum_from_judgment += *reward;
            }

            // Check winner work submission.
            let entry = Self::ensure_work_entry_exists(entry_id)?;
            ensure!(
                entry.work_submitted,
                Error::<T>::WinnerShouldHasWorkSubmission
            );
        }

        // Check for invalid total sum for successful bounty.
        if reward_sum_from_judgment != Zero::zero() {
            ensure!(
                reward_sum_from_judgment == bounty.total_funding, // 100% bounty distribution
                Error::<T>::TotalRewardShouldBeEqualToTotalFunding
            );
        }

        Ok(())
    }

    // Removes the work entry and decrements active entry count in a bounty.
    fn remove_work_entry(bounty_id: &T::BountyId, entry_id: &T::EntryId) {
        <Entries<T>>::remove(entry_id);

        // Decrement work entry counter and update bounty record.
        <Bounties<T>>::mutate(bounty_id, |bounty| {
            bounty.decrement_active_work_entry_counter();
        });
    }

    // Calculates weight for submit_oracle_judgement extrinsic.
    fn submit_oracle_judgement_weight(judgement: &OracleJudgmentOf<T>) -> Weight {
        let collection_length: u32 = judgement.len().saturated_into();

        WeightInfoBounty::<T>::submit_oracle_judgment_by_council_all_winners(collection_length)
            .max(
                WeightInfoBounty::<T>::submit_oracle_judgment_by_council_all_rejected(
                    collection_length,
                ),
            )
            .max(
                WeightInfoBounty::<T>::submit_oracle_judgment_by_member_all_winners(
                    collection_length,
                ),
            )
            .max(
                WeightInfoBounty::<T>::submit_oracle_judgment_by_member_all_rejected(
                    collection_length,
                ),
            )
    }

    // Bounty stage validator.
    fn ensure_bounty_stage(
        actual_stage: BountyStage,
        expected_stage: BountyStage,
    ) -> DispatchResult {
        ensure!(
            actual_stage == expected_stage,
            Self::unexpected_bounty_stage_error(actual_stage)
        );

        Ok(())
    }

    // Bounty stage validator for cancel_bounty() extrinsic.
    fn ensure_bounty_stage_for_canceling(actual_stage: BountyStage) -> DispatchResult {
        let funding_stage_with_no_contributions = BountyStage::Funding {
            has_contributions: false,
        };

        ensure!(
            actual_stage == funding_stage_with_no_contributions
                || actual_stage == BountyStage::FundingExpired,
            Self::unexpected_bounty_stage_error(actual_stage)
        );

        Ok(())
    }

    // Provides fined-grained errors for a bounty stages
    fn unexpected_bounty_stage_error(unexpected_stage: BountyStage) -> DispatchError {
        match unexpected_stage {
            BountyStage::Funding { .. } => Error::<T>::InvalidStageUnexpectedFunding.into(),
            BountyStage::FundingExpired => Error::<T>::InvalidStageUnexpectedFundingExpired.into(),
            BountyStage::WorkSubmission => Error::<T>::InvalidStageUnexpectedWorkSubmission.into(),
            BountyStage::Judgment => Error::<T>::InvalidStageUnexpectedJudgment.into(),
            BountyStage::SuccessfulBountyWithdrawal => {
                Error::<T>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into()
            }
            BountyStage::FailedBountyWithdrawal => {
                Error::<T>::InvalidStageUnexpectedFailedBountyWithdrawal.into()
            }
        }
    }

    // Oracle judgment helper. Returns true if a judgement contains at least one winner.
    pub(crate) fn judgment_has_winners(judgment: &OracleJudgmentOf<T>) -> bool {
        judgment.iter().any(|(_, j)| j.is_winner())
    }

    // Transfers cherry back to the bounty creator and fires an event.
    fn return_bounty_cherry_to_creator(
        bounty_id: T::BountyId,
        bounty: &Bounty<T>,
    ) -> DispatchResult {
        let bounty_creator_manager = BountyActorManager::<T>::get_bounty_actor_manager(
            bounty.creation_params.creator.clone(),
        )?;

        bounty_creator_manager
            .transfer_funds_from_bounty_account(bounty_id, bounty.creation_params.cherry)?;

        Self::deposit_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            bounty.creation_params.creator.clone(),
        ));

        Ok(())
    }

    // Calculates weight for create_bounty extrinsic.
    fn create_bounty_weight(params: &BountyCreationParameters<T>, metadata: &[u8]) -> Weight {
        let metadata_length = metadata.len().saturated_into();
        let member_list_length =
            if let AssuranceContractType::Closed(ref members) = params.contract_type {
                members.len().saturated_into()
            } else {
                1 // consider open contract member list as one.
            };

        WeightInfoBounty::<T>::create_bounty_by_member(metadata_length, member_list_length).max(
            WeightInfoBounty::<T>::create_bounty_by_council(metadata_length, member_list_length),
        )
    }
}
