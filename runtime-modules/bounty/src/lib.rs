//! This pallet works with crowd funded bounties that allows a member, or the council, to crowd
//! fund work on projects with a public benefit.
//!
//! ### Bounty stages
//! - Funding - a bounty is being funded.
//! - WorkSubmission - interested participants can submit their work.
//! - Judgement - working periods ended and the oracle should provide their judgement.
//! - Withdrawal - all funds can be withdrawn.
//!
//! A detailed description could be found [here](https://github.com/Joystream/joystream/issues/1998).
//!
//! ### Supported extrinsics:
//! - [create_bounty](./struct.Module.html#method.create_bounty) - creates a bounty
//! - [cancel_bounty](./struct.Module.html#method.cancel_bounty) - cancels a bounty
//! - [veto_bounty](./struct.Module.html#method.veto_bounty) - vetoes a bounty
//! - [fund_bounty](./struct.Module.html#method.fund_bounty) - provide funding for a bounty
//! - [withdraw_funding](./struct.Module.html#method.withdraw_funding) - withdraw
//! funding for a failed bounty.
//! - [withdraw_creator_cherry](./struct.Module.html#method.withdraw_creator_cherry) - withdraw
//! a cherry for a failed or canceled bounty.
//! - [announce_work_entry](./struct.Module.html#method.announce_work_entry) - announce
//! work entry for a successful bounty.
//! - [withdraw_work_entry](./struct.Module.html#method.withdraw_work_entry) - withdraw
//! work entry for a bounty.
//! - [submit_work](./struct.Module.html#method.submit_work) - submit work for a bounty.
//! - [submit_oracle_judgement](./struct.Module.html#method.submit_oracle_judgement) - submits an
//! oracle judgement for a bounty.

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(test)]
pub(crate) mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

// TODO: add bounty milestones module comments
// TODO: add working stake unstaking period.
// TODO: prevent bounty removal with active entries
// TODO: test all stages
// TODO: Does no work entries mean "failed bounty" with cherry loss? Or no work submissions with
// existing work entries?
// TODO: make sure cherry goes back to creator on successful bounty.

/// pallet_bounty WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn create_bounty_by_council() -> Weight;
    fn create_bounty_by_member() -> Weight;
    fn cancel_bounty_by_member() -> Weight;
    fn cancel_bounty_by_council() -> Weight;
    fn veto_bounty() -> Weight;
    fn fund_bounty_by_member() -> Weight;
    fn fund_bounty_by_council() -> Weight;
    fn withdraw_funding_by_member() -> Weight;
    fn withdraw_funding_by_council() -> Weight;
    fn withdraw_creator_cherry_by_council() -> Weight;
    fn withdraw_creator_cherry_by_member() -> Weight;
    fn announce_work_entry() -> Weight;
    fn withdraw_work_entry() -> Weight;
    fn submit_work(i: u32) -> Weight;
}

type WeightInfoBounty<T> = <T as Trait>::WeightInfo;

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{Currency, ExistenceRequirement, Get};
use frame_support::weights::Weight;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
use frame_system::ensure_root;
use sp_arithmetic::traits::{Saturating, Zero};
use sp_runtime::SaturatedConversion;
use sp_runtime::{
    traits::{AccountIdConversion, Hash},
    ModuleId,
};
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec::Vec;

use common::council::CouncilBudgetManager;
use common::origin::MemberOriginValidator;
use common::MemberId;
use staking_handler::StakingHandler;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_runtime::Perbill;

/// Main pallet-bounty trait.
pub trait Trait: frame_system::Trait + balances::Trait + common::Trait {
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// The bounty's module id, used for deriving its sovereign account ID.
    type ModuleId: Get<ModuleId>;

    /// Bounty Id type
    type BountyId: From<u32> + Parameter + Default + Copy;

    /// Validates member ID and origin combination.
    type MemberOriginValidator: MemberOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Provides an access for the council budget.
    type CouncilBudgetManager: CouncilBudgetManager<BalanceOf<Self>>;

    /// Provides stake logic implementation.
    type StakingHandler: StakingHandler<Self::AccountId, BalanceOf<Self>, MemberId<Self>>;

    /// Work entry Id type
    type WorkEntryId: From<u32> + Parameter + Default + Copy;

    /// Defines max work entry number for a bounty.
    /// It limits further work entries iteration after the judge decision about winners, non-winners
    /// and "byzantine" (malicious) users.
    type MaxWorkEntryLimit: Get<u32>;

    /// Defines min cherry for a bounty.
    type MinCherryLimit: Get<BalanceOf<Self>>;

    /// Defines min funding amount for a bounty.
    type MinFundingLimit: Get<BalanceOf<Self>>;
}

/// Alias type for the BountyParameters.
pub type BountyCreationParameters<T> = BountyParameters<
    BalanceOf<T>,
    <T as frame_system::Trait>::BlockNumber,
    <T as common::Trait>::MemberId,
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

    /// An mount of funding, possibly 0, provided by the creator which will be split among all other
    /// contributors should the min funding bound not be reached. If reached, cherry is returned to
    /// the creator. When council is creating bounty, this comes out of their budget, when a member
    /// does it, it comes from an account.
    pub cherry: Balance,

    /// The minimum total quantity of funds, possibly 0, required for the bounty to become
    /// available for people to work on.
    pub min_amount: Balance,

    /// Maximum funding accepted, if this limit is reached, funding automatically is over.
    pub max_amount: Balance,

    /// Amount of stake required, possibly 0, to enter bounty as entrant.
    pub entrant_stake: Balance,

    /// Number of blocks from creation until funding is no longer possible. If not provided, then
    /// funding is called perpetual, and it only ends when minimum amount is reached.
    pub funding_period: Option<BlockNumber>,

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
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum BountyStage {
    /// Bounty founding stage.
    Funding {
        /// Bounty has already some contributions.
        has_contributions: bool,
    },

    /// A bounty has gathered necessary funds and ready to accept work submissions.
    WorkSubmission,

    /// Working periods ended and the oracle should provide their judgement.
    Judgement,

    /// Funding and cherry can be withdrawn.
    Withdrawal {
        /// Creator cherry is not withdrawn and greater than zero.
        cherry_needs_withdrawal: bool,
    },
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

    /// A bounty was canceled.
    Canceled,

    /// A bounty funding was successful and it exceeded max funding amount.
    BountyMaxFundingReached {
        ///  A bounty funding was successful on the provided block.
        max_funding_reached_at: BlockNumber,
    },

    /// Some work was submitted for a bounty..
    WorkSubmitted {
        ///  Starting block for the work period.
        work_period_started_at: BlockNumber,
    },

    /// Creator cherry was withdrawn.
    CreatorCherryWithdrawn,
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
    <T as common::Trait>::MemberId,
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

    /// Oracle judgement for the bounty.
    pub judgement: Option<OracleJudgement<MemberId>>,
}

impl<Balance, BlockNumber, MemberId: Ord> BountyRecord<Balance, BlockNumber, MemberId> {
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
}

/// Alias type for the WorkEntry.
pub type WorkEntry<T> = WorkEntryRecord<
    <T as frame_system::Trait>::AccountId,
    <T as common::Trait>::MemberId,
    <T as frame_system::Trait>::BlockNumber,
>;

/// Work entry.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct WorkEntryRecord<AccountId, MemberId, BlockNumber> {
    /// Work entrant member ID.
    pub member_id: MemberId,

    /// Optional account ID for staking lock.
    pub staking_account_id: Option<AccountId>,

    /// Work entry submission block.
    pub submitted_at: BlockNumber,

    /// Last submitted work data hash.
    pub last_submitted_work: Option<Vec<u8>>,
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

/// OracleJudgement alias.
pub type OracleJudgementOf<T> = OracleJudgement<MemberId<T>>;

/// Work entry.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct OracleJudgement<MemberId: Ord> {
    /// Work accepted for this users and they split bounty funding.
    pub winners: BTreeSet<MemberId>,

    /// Legitimate entrants, yet not winning, which results in them being able to withdraw
    /// their full stake.
    pub legitimate_participants: BTreeSet<MemberId>,
}

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

        /// Work entry storage double map.
        pub WorkEntries get(fn work_entries): double_map
            hasher(blake2_128_concat) T::BountyId,
            hasher(blake2_128_concat) T::WorkEntryId => WorkEntry<T>;

        /// Count of all work entries that have been created.
        pub WorkEntryCount get(fn work_entry_count): u32;
    }
}

decl_event! {
    pub enum Event<T>
    where
        <T as Trait>::BountyId,
        <T as Trait>::WorkEntryId,
        Balance = BalanceOf<T>,
        MemberId = MemberId<T>,
        <T as frame_system::Trait>::AccountId,
        BountyCreationParameters = BountyCreationParameters<T>,
        OracleJudgement = OracleJudgementOf<T>,
    {
        /// A bounty was created.
        BountyCreated(BountyId, BountyCreationParameters),

        /// A bounty was canceled.
        BountyCanceled(BountyId, BountyActor<MemberId>),

        /// A bounty was vetoed.
        BountyVetoed(BountyId),

        /// A bounty was funded by a member or a council.
        BountyFunded(BountyId, BountyActor<MemberId>, Balance),

        /// A bounty has reached its maximum funding amount.
        BountyMaxFundingReached(BountyId),

        /// A member or a council has withdrawn the funding.
        BountyFundingWithdrawal(BountyId, BountyActor<MemberId>),

        /// A bounty creator has withdrew the funding (member or council).
        BountyCreatorFundingWithdrawal(BountyId, BountyActor<MemberId>),

        /// A bounty was removed.
        BountyRemoved(BountyId),

        /// Work entry was announced.
        /// Params:
        /// - bounty ID
        /// - created entry ID
        /// - entrant member ID
        /// - optional staking account ID
        WorkEntryAnnounced(BountyId, WorkEntryId, MemberId, Option<AccountId>),

        /// Work entry was withdrawn.
        /// Params:
        /// - bounty ID
        /// - created entry ID
        /// - entrant member ID
        WorkEntryWithdrawn(BountyId, WorkEntryId, MemberId),

        /// Submit work.
        /// Params:
        /// - bounty ID
        /// - created entry ID
        /// - entrant member ID
        /// - work data (description, URL, BLOB, etc.)
        WorkSubmitted(BountyId, WorkEntryId, MemberId, Vec<u8>),

        /// Submit oracle judgement.
        /// Params:
        /// - bounty ID
        /// - oracle
        /// - judgement data
        OracleJudgementSubmitted(BountyId, BountyActor<MemberId>, OracleJudgement),
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

        /// Invalid bounty stage for the operation.
        InvalidBountyStage,

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

        /// No staking account was provided.
        NoStakingAccountProvided,

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

        /// Judgement decision member_id collections exceeded the maximum entry limit.
        InvalidJudgementCollectionLength,

        /// Judgement contains the same member_id in `winner` and `legitimate_participants`
        /// collections.
        DuplicatedMembersInJudgement,
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

        /// Exports const - max work entry number for a bounty.
        const MaxWorkEntryLimit: u32 = T::MaxWorkEntryLimit::get();

        /// Exports const - min cherry value limit for a bounty.
        const MinCherryLimit: BalanceOf<T> = T::MinCherryLimit::get();

        /// Exports const - min funding amount limit for a bounty.
        const MinFundingLimit: BalanceOf<T> = T::MinFundingLimit::get();

        /// Creates a bounty. Metadata stored in the transaction log but discarded after that.
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the _metadata length.
        /// - DB:
        ///    - O(1)
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::create_bounty_by_member()
              .max(WeightInfoBounty::<T>::create_bounty_by_council())]
        pub fn create_bounty(origin, params: BountyCreationParameters<T>, _metadata: Vec<u8>) {
            let bounty_creator_manager = BountyActorManager::<T>::get_bounty_actor(
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
                judgement: None,
            };

            <Bounties<T>>::insert(bounty_id, bounty);
            BountyCount::mutate(|count| {
                *count = next_bounty_count_value
            });
            Self::deposit_event(RawEvent::BountyCreated(bounty_id, params));
        }

        /// Cancels a bounty.
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
            let bounty_creator_manager = BountyActorManager::<T>::get_bounty_actor(
                origin,
                creator.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            bounty_creator_manager.validate_actor(&bounty.creation_params.creator)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            ensure!(
                matches!(current_bounty_stage, BountyStage::Funding { has_contributions: false }),
                Error::<T>::InvalidBountyStage,
            );

            //
            // == MUTATION SAFE ==
            //

            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.milestone = BountyMilestone::Canceled;
            });

            Self::deposit_event(RawEvent::BountyCanceled(bounty_id, creator));
        }

        /// Vetoes a bounty.
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

            ensure!(
                matches!(current_bounty_stage, BountyStage::Funding { has_contributions: false }),
                Error::<T>::InvalidBountyStage,
            );

            //
            // == MUTATION SAFE ==
            //

            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.milestone = BountyMilestone::Canceled;
            });

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
            let bounty_funder_manager = BountyActorManager::<T>::get_bounty_actor(
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
                Error::<T>::InvalidBountyStage,
            );

            //
            // == MUTATION SAFE ==
            //

            bounty_funder_manager.transfer_funds_to_bounty_account(bounty_id, amount)?;

            let total_funding = bounty.total_funding.saturating_add(amount);
            let maximum_funding_reached = total_funding >= bounty.creation_params.max_amount;
            let new_milestone = Self::get_bounty_milestone_on_funding(
                    maximum_funding_reached,
                    bounty.milestone
            );

            // Update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.total_funding = total_funding;
                bounty.milestone = new_milestone;
            });

            // Update member funding record checking previous funding.
            let funds_so_far = Self::contribution_by_bounty_by_actor(bounty_id, &funder);
            let total_funding = funds_so_far.saturating_add(amount);
            <BountyContributions<T>>::insert(bounty_id, funder.clone(), total_funding);

            // Fire events.
            Self::deposit_event(RawEvent::BountyFunded(bounty_id, funder, amount));
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
            let bounty_funder_manager = BountyActorManager::<T>::get_bounty_actor(
                origin,
                funder.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::Withdrawal{..}),
                Error::<T>::InvalidBountyStage,
            );

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

        /// Withdraw creator funding.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::withdraw_creator_cherry_by_member()
              .max(WeightInfoBounty::<T>::withdraw_creator_cherry_by_council())]
        pub fn withdraw_creator_cherry(
            origin,
            creator: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
        ) {
            let bounty_creator_manager = BountyActorManager::<T>::get_bounty_actor(
                origin,
                creator.clone(),
            )?;

            let mut bounty = Self::ensure_bounty_exists(&bounty_id)?;

            bounty_creator_manager.validate_actor(&bounty.creation_params.creator)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            if let BountyStage::Withdrawal {cherry_needs_withdrawal } = current_bounty_stage {
                ensure!(cherry_needs_withdrawal, Error::<T>::NothingToWithdraw);
            } else {
                return Err(Error::<T>::InvalidBountyStage.into());
            };

            //
            // == MUTATION SAFE ==
            //

            let cherry = Self::get_cherry_for_creator_withdrawal(&bounty, current_bounty_stage);

            bounty_creator_manager.transfer_funds_from_bounty_account(bounty_id, cherry)?;

            bounty.milestone = BountyMilestone::CreatorCherryWithdrawn;
            <Bounties<T>>::insert(bounty_id, bounty.clone());

            Self::deposit_event(RawEvent::BountyCreatorFundingWithdrawal(bounty_id, creator));

            let new_bounty_stage = Self::get_bounty_stage(&bounty);

            if Self::withdrawal_completed(&new_bounty_stage, &bounty_id) {
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
        #[weight = WeightInfoBounty::<T>::announce_work_entry()]
        pub fn announce_work_entry(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            staking_account_id: Option<T::AccountId>,
        ) {
            T::MemberOriginValidator::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::WorkSubmission),
                Error::<T>::InvalidBountyStage,
            );

            let stake = Self::validate_entrant_stake(&bounty, staking_account_id.clone())?;

            ensure!(
                bounty.active_work_entry_count < T::MaxWorkEntryLimit::get(),
                Error::<T>::MaxWorkEntryLimitReached,
            );

            Self::ensure_valid_contract_type(&bounty, &member_id)?;

            //
            // == MUTATION SAFE ==
            //

            let next_entry_count_value = Self::work_entry_count() + 1;
            let entry_id = T::WorkEntryId::from(next_entry_count_value);

            // Lock stake balance for bounty if the stake is required.
            if let Some(stake) = stake {
                T::StakingHandler::lock(&stake.account_id, stake.amount);
            }

            let entry = WorkEntry::<T> {
                member_id,
                staking_account_id: staking_account_id.clone(),
                submitted_at: Self::current_block(),
                last_submitted_work: None,
            };

            <WorkEntries<T>>::insert(bounty_id, entry_id, entry);
            WorkEntryCount::mutate(|count| {
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
            entry_id: T::WorkEntryId,
        ) {
            T::MemberOriginValidator::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::WorkSubmission),
                Error::<T>::InvalidBountyStage,
            );

            let entry = Self::ensure_work_entry_exists(&bounty_id, &entry_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::unlock_work_entry_stake(&bounty, &entry);

            <WorkEntries<T>>::remove(bounty_id, entry_id);

            // Decrement work entry counter and update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.decrement_active_work_entry_counter();
            });

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
            entry_id: T::WorkEntryId,
            work_data: Vec<u8>
        ) {
            T::MemberOriginValidator::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::WorkSubmission),
                Error::<T>::InvalidBountyStage,
            );

            Self::ensure_work_entry_exists(&bounty_id, &entry_id)?;

            //
            // == MUTATION SAFE ==
            //

            let hashed = T::Hashing::hash(&work_data);
            let work_data_hash = hashed.as_ref().to_vec();

            // Update entry
            <WorkEntries<T>>::mutate(bounty_id, entry_id, |entry| {
                entry.last_submitted_work = Some(work_data_hash);
            });

            let new_milestone = Self::get_bounty_milestone_on_work_submitting(&bounty);

            // Update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.milestone = new_milestone;
            });

            Self::deposit_event(RawEvent::WorkSubmitted(bounty_id, entry_id, member_id, work_data));
        }

        /// Submits an oracle judgement for a bounty.
        #[weight =  1000000] // TODO adjust weight
        pub fn submit_oracle_judgement(
            origin,
            creator: BountyActor<MemberId<T>>,
            bounty_id: T::BountyId,
            judgement: OracleJudgement<MemberId<T>>,
        ) {
            let bounty_oracle_manager = BountyActorManager::<T>::get_bounty_actor(
                origin,
                creator.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            bounty_oracle_manager.validate_actor(&bounty.creation_params.oracle)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::Judgement),
                Error::<T>::InvalidBountyStage,
            );

            Self::validate_judgement(&judgement)?;

            // TODO: check that judgement doesn't exist.

            // TODO: check that judgement matches the work entries.

            // TODO: consider judgement milestone?

            //
            // == MUTATION SAFE ==
            //

            // Update bounty record.
            <Bounties<T>>::mutate(bounty_id, |bounty| {
                bounty.judgement = Some(judgement.clone());
            });
            Self::deposit_event(RawEvent::OracleJudgementSubmitted(bounty_id, creator, judgement));
        }
    }
}

// Helper enum for the bounty management.
enum BountyActorManager<T: Trait> {
    // Bounty was created or funded by a council.
    Council,

    // Bounty was created or funded by a member.
    Member(T::AccountId, MemberId<T>),
}

impl<T: Trait> BountyActorManager<T> {
    // Construct BountyActor by extrinsic origin and optional member_id.
    fn get_bounty_actor(
        origin: T::Origin,
        creator: BountyActor<MemberId<T>>,
    ) -> Result<BountyActorManager<T>, DispatchError> {
        match creator {
            BountyActor::Member(member_id) => {
                let account_id = T::MemberOriginValidator::ensure_member_controller_account_origin(
                    origin, member_id,
                )?;

                Ok(BountyActorManager::Member(account_id, member_id))
            }
            BountyActor::Council => {
                ensure_root(origin)?;

                Ok(BountyActorManager::Council)
            }
        }
    }

    // Validate balance is sufficient for the bounty
    fn validate_balance_sufficiency(&self, required_balance: BalanceOf<T>) -> DispatchResult {
        let balance_is_sufficient = match self {
            BountyActorManager::Council => {
                BountyActorManager::<T>::check_council_budget(required_balance)
            }
            BountyActorManager::Member(account_id, _) => {
                Module::<T>::check_balance_for_account(required_balance, account_id)
            }
        };

        ensure!(
            balance_is_sufficient,
            Error::<T>::InsufficientBalanceForBounty
        );

        Ok(())
    }

    // Verifies that council budget is sufficient for a bounty.
    fn check_council_budget(amount: BalanceOf<T>) -> bool {
        T::CouncilBudgetManager::get_budget() >= amount
    }

    // Validate that provided actor relates to the initial BountyActor.
    fn validate_actor(&self, actor: &BountyActor<MemberId<T>>) -> DispatchResult {
        let initial_actor = match self {
            BountyActorManager::Council => BountyActor::Council,
            BountyActorManager::Member(_, member_id) => BountyActor::Member(*member_id),
        };

        ensure!(initial_actor == actor.clone(), Error::<T>::NotBountyActor);

        Ok(())
    }

    // Transfer funds for the bounty creation.
    fn transfer_funds_to_bounty_account(
        &self,
        bounty_id: T::BountyId,
        required_balance: BalanceOf<T>,
    ) -> DispatchResult {
        match self {
            BountyActorManager::Council => {
                BountyActorManager::<T>::transfer_balance_from_council_budget(
                    bounty_id,
                    required_balance,
                );
            }
            BountyActorManager::Member(account_id, _) => {
                Module::<T>::transfer_funds_to_bounty_account(
                    account_id,
                    bounty_id,
                    required_balance,
                )?;
            }
        }

        Ok(())
    }

    // Restore a balance for the bounty creator.
    fn transfer_funds_from_bounty_account(
        &self,
        bounty_id: T::BountyId,
        required_balance: BalanceOf<T>,
    ) -> DispatchResult {
        match self {
            BountyActorManager::Council => {
                BountyActorManager::<T>::transfer_balance_to_council_budget(
                    bounty_id,
                    required_balance,
                );
            }
            BountyActorManager::Member(account_id, _) => {
                Module::<T>::transfer_funds_from_bounty_account(
                    account_id,
                    bounty_id,
                    required_balance,
                )?;
            }
        }

        Ok(())
    }

    // Remove some balance from the council budget and transfer it to the bounty account.
    fn transfer_balance_from_council_budget(bounty_id: T::BountyId, amount: BalanceOf<T>) {
        let budget = T::CouncilBudgetManager::get_budget();
        let new_budget = budget.saturating_sub(amount);

        T::CouncilBudgetManager::set_budget(new_budget);

        let bounty_account_id = Module::<T>::bounty_account_id(bounty_id);
        let _ = balances::Module::<T>::deposit_creating(&bounty_account_id, amount);
    }

    // Add some balance from the council budget and slash from the bounty account.
    fn transfer_balance_to_council_budget(bounty_id: T::BountyId, amount: BalanceOf<T>) {
        let bounty_account_id = Module::<T>::bounty_account_id(bounty_id);
        let _ = balances::Module::<T>::slash(&bounty_account_id, amount);

        let budget = T::CouncilBudgetManager::get_budget();
        let new_budget = budget.saturating_add(amount);

        T::CouncilBudgetManager::set_budget(new_budget);
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

        ensure!(
            params.min_amount <= params.max_amount,
            Error::<T>::MinFundingAmountCannotBeGreaterThanMaxAmount
        );

        ensure!(
            params.cherry >= T::MinCherryLimit::get(),
            Error::<T>::CherryLessThenMinimumAllowed
        );

        if let AssuranceContractType::Closed(ref member_ids) = params.contract_type {
            ensure!(
                !member_ids.is_empty(),
                Error::<T>::ClosedContractMemberListIsEmpty
            );

            ensure!(
                member_ids.len() <= T::MaxWorkEntryLimit::get().saturated_into(),
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
            ExistenceRequirement::KeepAlive,
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
            ExistenceRequirement::KeepAlive,
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

    // Calculate cherry to withdraw by bounty creator.
    fn get_cherry_for_creator_withdrawal(bounty: &Bounty<T>, stage: BountyStage) -> BalanceOf<T> {
        if let BountyStage::Withdrawal {
            cherry_needs_withdrawal,
        } = stage
        {
            if cherry_needs_withdrawal {
                return bounty.creation_params.cherry;
            }
        }

        Zero::zero()
    }

    // Remove bounty and all related info from the storage.
    fn remove_bounty(bounty_id: &T::BountyId) {
        <Bounties<T>>::remove(bounty_id);
        <BountyContributions<T>>::remove_prefix(bounty_id);
        <WorkEntries<T>>::remove_prefix(bounty_id);

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
        !Self::contributions_exist(bounty_id)
            && matches!(
                stage,
                BountyStage::Withdrawal {
                    cherry_needs_withdrawal: false,
                }
            )
    }

    // Verifies that bounty has some contribution to withdraw.
    // Should be O(1) because of the single inner call of the next() function of the iterator.
    pub(crate) fn contributions_exist(bounty_id: &T::BountyId) -> bool {
        <BountyContributions<T>>::iter_prefix_values(bounty_id)
            .peekable()
            .peek()
            .is_some()
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
                // Limited funding period.
                if let Some(funding_period) = bounty.creation_params.funding_period {
                    return BountyMilestone::WorkSubmitted {
                        work_period_started_at: created_at + funding_period,
                    };
                }

                // Unlimited funding period.
                previous_milestone
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
        bounty: &Bounty<T>,
        staking_account_id: Option<T::AccountId>,
    ) -> Result<Option<RequiredStakeInfo<T>>, DispatchError> {
        let staking_balance = bounty.creation_params.entrant_stake;

        if staking_balance != Zero::zero() {
            if let Some(staking_account_id) = staking_account_id {
                ensure!(
                    T::StakingHandler::is_account_free_of_conflicting_stakes(&staking_account_id),
                    Error::<T>::ConflictingStakes
                );

                ensure!(
                    T::StakingHandler::is_enough_balance_for_stake(
                        &staking_account_id,
                        staking_balance
                    ),
                    Error::<T>::InsufficientBalanceForStake
                );

                Ok(Some(RequiredStakeInfo {
                    amount: staking_balance,
                    account_id: staking_account_id,
                }))
            } else {
                // No staking account when required.
                Err(Error::<T>::NoStakingAccountProvided.into())
            }
        } else {
            // No stake required
            Ok(None)
        }
    }

    // Verifies work entry existence and retrieves an entry from the storage.
    fn ensure_work_entry_exists(
        bounty_id: &T::BountyId,
        entry_id: &T::WorkEntryId,
    ) -> Result<WorkEntry<T>, DispatchError> {
        ensure!(
            <WorkEntries<T>>::contains_key(bounty_id, entry_id),
            Error::<T>::WorkEntryDoesntExist
        );

        let entry = <WorkEntries<T>>::get(bounty_id, entry_id);

        Ok(entry)
    }

    // Unlocks the work entry stake.
    // It also calculates and slashes the stake on work entry withdrawal.
    // The slashing amount depends on the entry active period.
    fn unlock_work_entry_stake(bounty: &Bounty<T>, entry: &WorkEntry<T>) {
        if let Some(staking_account_id) = &entry.staking_account_id {
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

        sc.is_funding_stage()
            .or_else(|| sc.is_work_submission_stage())
            .or_else(|| sc.is_judgement_stage())
            .unwrap_or_else(|| sc.withdrawal_stage())
    }

    // Validates oracle judgement.
    fn validate_judgement(judgement: &OracleJudgement<MemberId<T>>) -> DispatchResult {
        let selected_workers_number =
            judgement.winners.len() + judgement.legitimate_participants.len();

        // Check collections length.
        ensure!(
            selected_workers_number <= T::MaxWorkEntryLimit::get().saturated_into(),
            Error::<T>::InvalidJudgementCollectionLength
        );

        let unique_selected_workers_number = judgement
            .winners
            .clone()
            .union(&judgement.legitimate_participants)
            .count();

        // Check for duplicates.
        ensure!(
            selected_workers_number == unique_selected_workers_number,
            Error::<T>::DuplicatedMembersInJudgement
        );

        Ok(())
    }
}

// Bounty stage helper.
struct BountyStageCalculator<'a, T: Trait> {
    // current block number
    now: T::BlockNumber,
    // bounty object
    bounty: &'a Bounty<T>,
}

impl<'a, T: Trait> BountyStageCalculator<'a, T> {
    // Calculates funding stage of the bounty.
    // Returns None if conditions are not met.
    fn is_funding_stage(&self) -> Option<BountyStage> {
        // Bounty was created. There can be some contributions. Funding period is not over.
        if let BountyMilestone::Created {
            has_contributions,
            created_at,
        } = self.bounty.milestone.clone()
        {
            let funding_period_is_not_expired = !self.funding_period_expired(created_at);

            if funding_period_is_not_expired {
                return Some(BountyStage::Funding { has_contributions });
            }
        }

        None
    }

    // Calculates work submission stage of the bounty.
    // Returns None if conditions are not met.
    fn is_work_submission_stage(&self) -> Option<BountyStage> {
        match self.bounty.milestone.clone() {
            // Funding period is over. Minimum funding reached. Work period is not expired.
            BountyMilestone::Created { created_at, .. } => {
                // Limited funding period.
                if let Some(funding_period) = self.bounty.creation_params.funding_period {
                    let minimum_funding_reached = self.minimum_funding_reached();
                    let funding_period_expired = self.funding_period_expired(created_at);
                    let working_period_is_not_expired =
                        !self.work_period_expired(created_at + funding_period);

                    if minimum_funding_reached
                        && funding_period_expired
                        && working_period_is_not_expired
                    {
                        return Some(BountyStage::WorkSubmission);
                    }
                }
            }
            // Maximum funding reached. Work period is not expired.
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
            } => {
                let work_period_is_not_expired = !self.work_period_expired(max_funding_reached_at);

                if work_period_is_not_expired {
                    return Some(BountyStage::WorkSubmission);
                }
            }
            // Work in progress. Work period is not expired.
            BountyMilestone::WorkSubmitted {
                work_period_started_at,
            } => {
                let work_period_is_not_expired = !self.work_period_expired(work_period_started_at);

                if work_period_is_not_expired {
                    return Some(BountyStage::WorkSubmission);
                }
            }
            _ => return None,
        }

        None
    }

    // Calculates judgement stage of the bounty.
    // Returns None if conditions are not met.
    fn is_judgement_stage(&self) -> Option<BountyStage> {
        // Can be judged only if there are work submissions.
        if let BountyMilestone::WorkSubmitted {
            work_period_started_at,
        } = self.bounty.milestone
        {
            let work_period_expired = self.work_period_expired(work_period_started_at);

            let judgement_period_is_not_expired =
                !self.judgement_period_expired(work_period_started_at);

            if work_period_expired && judgement_period_is_not_expired {
                return Some(BountyStage::Judgement);
            }
        }

        None
    }

    // Calculates withdrawal stage of the bounty.
    // Returns None if conditions are not met.
    fn withdrawal_stage(&self) -> BountyStage {
        let default_stage = BountyStage::Withdrawal {
            cherry_needs_withdrawal: true,
        };

        match self.bounty.milestone.clone() {
            // Funding period. No contributions or not enough contributions.
            BountyMilestone::Created {
                has_contributions,
                created_at,
            } => {
                let funding_period_expired = self.funding_period_expired(created_at);

                let minimum_funding_is_not_reached = !self.minimum_funding_reached();

                if minimum_funding_is_not_reached && funding_period_expired {
                    return BountyStage::Withdrawal {
                        cherry_needs_withdrawal: !has_contributions,
                    };
                }
            }
            // No work submitted.
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
            } => {
                let work_period_expired = self.work_period_expired(max_funding_reached_at);

                if work_period_expired {
                    return default_stage;
                }
            }
            // Bounty was canceled or vetoed.
            BountyMilestone::Canceled => return default_stage,
            // It is withdrawal stage and the creator don't expect any withdrawals.
            BountyMilestone::CreatorCherryWithdrawn => {
                return BountyStage::Withdrawal {
                    cherry_needs_withdrawal: false,
                }
            }
            // Work submitted but no judgement.
            BountyMilestone::WorkSubmitted {
                work_period_started_at,
            } => {
                let work_period_expired = self.work_period_expired(work_period_started_at);

                let judgement_period_is_expired =
                    self.judgement_period_expired(work_period_started_at);

                if work_period_expired && judgement_period_is_expired {
                    return default_stage;
                }
            }
        }

        default_stage
    }

    // Checks whether the minimum funding reached for the bounty.
    fn minimum_funding_reached(&self) -> bool {
        self.bounty.total_funding >= self.bounty.creation_params.min_amount
    }

    // Checks whether the work period expired by now starting from the provided block number.
    fn work_period_expired(&self, work_period_started_at: T::BlockNumber) -> bool {
        work_period_started_at + self.bounty.creation_params.work_period < self.now
    }

    // Checks whether the funding period expired by now starting from the provided block number.
    fn funding_period_expired(&self, created_at: T::BlockNumber) -> bool {
        // Limited funding period
        if let Some(funding_period) = self.bounty.creation_params.funding_period {
            return created_at + funding_period < self.now;
        }

        // Unlimited funding period
        false
    }

    // Checks whether the judgement period expired by now when work period start from the provided
    // block number.
    fn judgement_period_expired(&self, work_period_started_at: T::BlockNumber) -> bool {
        work_period_started_at
            + self.bounty.creation_params.work_period
            + self.bounty.creation_params.judging_period
            < self.now
    }
}
