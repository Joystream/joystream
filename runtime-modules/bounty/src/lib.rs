//! This pallet works with crowd funded bounties that allows a member, or the council, to crowd
//! fund work on projects with a public benefit.
//!
//! ### Bounty stages
//! - Funding - a bounty is being funded.
//! - WorkSubmission - interested participants can submit their work.
//! - Withdrawal - all funds can be withdrawn.
//!
//! A detailed description could be found [here](https://github.com/Joystream/joystream/issues/1998).
//!
//! ### Supported extrinsics:
//! - [create_bounty](./struct.Module.html#method.create_bounty) - creates a bounty
//! - [cancel_bounty](./struct.Module.html#method.cancel_bounty) - cancels a bounty
//! - [veto_bounty](./struct.Module.html#method.veto_bounty) - vetoes a bounty
//! - [fund_bounty](./struct.Module.html#method.fund_bounty) - provide funding for a bounty
//! - [withdraw_member_funding](./struct.Module.html#method.withdraw_member_funding) - withdraw
//! funding for a failed bounty.
//! - [withdraw_creator_funding](./struct.Module.html#method.withdraw_creator_funding) - withdraw
//! funding for a failed or canceled bounty..

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(test)]
pub(crate) mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

// TODO: add max entries limit
// TODO: add more fine-grained errors.
// TODO: add bounty milestones module comments

/// pallet_bounty WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn create_bounty_by_council() -> Weight;
    fn create_bounty_by_member() -> Weight;
    fn cancel_bounty_by_member() -> Weight;
    fn cancel_bounty_by_council() -> Weight;
    fn veto_bounty() -> Weight;
    fn fund_bounty() -> Weight;
    fn withdraw_member_funding() -> Weight;
    fn withdraw_creator_funding_by_council() -> Weight;
    fn withdraw_creator_funding_by_member() -> Weight;
}

type WeightInfoBounty<T> = <T as Trait>::WeightInfo;

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{Currency, ExistenceRequirement, Get};
use frame_support::weights::Weight;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
use frame_system::ensure_root;
use sp_arithmetic::traits::Saturating;
use sp_arithmetic::traits::Zero;
use sp_runtime::{traits::AccountIdConversion, ModuleId};
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
}

/// Alias type for the BountyParameters.
pub type BountyCreationParameters<T> = BountyParameters<
    BalanceOf<T>,
    <T as frame_system::Trait>::BlockNumber,
    <T as common::Trait>::MemberId,
>;

/// Defines who will be the oracle of the work submissions.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Copy, Debug)]
pub enum OracleType<MemberId> {
    /// Specific member will be the oracle.
    Member(MemberId),

    /// Council will become an oracle.
    Council,
}

impl<MemberId> Default for OracleType<MemberId> {
    fn default() -> Self {
        OracleType::Council
    }
}

/// Defines who can submit the work.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum AssuranceContractType<MemberId> {
    /// Anyone can submit the work.
    Open,

    /// Only specific members can submit the work.
    Closed(Vec<MemberId>),
}

impl<MemberId> Default for AssuranceContractType<MemberId> {
    fn default() -> Self {
        AssuranceContractType::Open
    }
}

/// Defines parameters for the bounty creation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct BountyParameters<Balance, BlockNumber, MemberId> {
    /// Origin that will select winner(s), is either a given member or a council.
    pub oracle: OracleType<MemberId>,

    /// Contract type defines who can submit the work.
    pub contract_type: AssuranceContractType<MemberId>,

    /// Bounty creator: could be a member or a council.
    pub creator: BountyCreator<MemberId>,

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

    /// Funds provided by a bounty creator.
    pub creator_funding: Balance,
}

// Helper enum for the bounty management.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum BountyCreator<MemberId> {
    // Bounty was created by a council.
    Council,

    // Bounty was created by a member.
    Member(MemberId),
}

impl<MemberId> Default for BountyCreator<MemberId> {
    fn default() -> Self {
        BountyCreator::Council
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

    /// Funding and cherry can be withdrawn.
    Withdrawal {
        /// Creator funds are not withdrawn and greater than zero.
        creator_funds_need_withdrawal: bool,

        /// Creator cherry is not withdrawn and greater than zero.
        cherry_needs_withdrawal: bool,
    },

    /// A bounty has gathered necessary funds and ready to accept work submissions.
    WorkSubmission,
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

    /// Creator funds (initial funding and/or cherry) were withdrawn.
    CreatorFundsWithdrawn,

    /// A bounty funding was successful and it exceeded max funding amount.
    BountyMaxFundingReached {
        ///  A bounty funding was successful on the provided block.
        max_funding_reached_at: BlockNumber,
        /// A bounty reached its maximum allowed contribution on creation.
        reached_on_creation: bool,
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
    <T as common::Trait>::MemberId,
>;

/// Crowdfunded bounty record.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct BountyRecord<Balance, BlockNumber, MemberId> {
    /// Bounty creation parameters.
    pub creation_params: BountyParameters<Balance, BlockNumber, MemberId>,

    /// Total funding balance reached so far.
    /// Includes initial funding by a creator and other members funding.
    pub total_funding: Balance,

    /// Bounty current milestone(state). It represents fact known about the bounty, eg.:
    /// it was canceled or max funding amount was reached.
    pub milestone: BountyMilestone<BlockNumber>,
}

/// Alias type for the WorkEntry.
pub type WorkEntry<T> = WorkEntryRecord<
    <T as frame_system::Trait>::AccountId,
    <T as common::Trait>::MemberId,
    <T as Trait>::BountyId,
>;

/// Work entry.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct WorkEntryRecord<AccountId, MemberId, BountyId> {
    /// Work entrant member ID.
    pub member_id: MemberId,

    /// Bounty ID .
    pub bounty_id: BountyId,

    /// Optional account ID for staking lock.
    pub staking_account_id: Option<AccountId>,
}

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

decl_storage! {
    trait Store for Module<T: Trait> as Bounty {
        /// Bounty storage.
        pub Bounties get(fn bounties) : map hasher(blake2_128_concat) T::BountyId => Bounty<T>;

        /// Double map for bounty funding. It stores member funding for bounties.
        pub BountyContributions get(fn contribution_by_bounty_by_member): double_map
            hasher(blake2_128_concat) T::BountyId,
            hasher(blake2_128_concat) MemberId<T> => BalanceOf<T>;

        /// Count of all bounties that have been created.
        pub BountyCount get(fn bounty_count): u32;

        /// Work entry storage.
        pub WorkEntries get(fn work_entries) : map hasher(blake2_128_concat)
            T::WorkEntryId => WorkEntry<T>;

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
        <T as frame_system::Trait>::BlockNumber,
        <T as frame_system::Trait>::AccountId,
    {
        /// A bounty was created.
        BountyCreated(BountyId, BountyParameters<Balance, BlockNumber, MemberId>),

        /// A bounty was canceled.
        BountyCanceled(BountyId, BountyCreator<MemberId>),

        /// A bounty was vetoed.
        BountyVetoed(BountyId),

        /// A bounty was funded by a member.
        BountyFunded(BountyId, MemberId, Balance),

        /// A bounty has reached its maximum funding amount.
        BountyMaxFundingReached(BountyId),

        /// A member has withdrew the funding.
        BountyMemberFundingWithdrawal(BountyId, MemberId),

        /// A bounty creator has withdrew the funding.
        BountyCreatorFundingWithdrawal(BountyId, BountyCreator<MemberId>),

        /// A bounty was removed.
        BountyRemoved(BountyId),

        /// Work entry announced.
        /// Params:
        /// - bounty ID
        /// - entrant member ID
        /// - optional staking account ID
        /// - created entry ID
        WorkEntryAnnounced(BountyId, MemberId, Option<AccountId>, WorkEntryId),
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
        NotBountyCreator,

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

        /// A member is not a bounty funder.
        NotBountyFunder, //TODO change to "no bounty funding found"

        /// There is nothing to withdraw.
        NothingToWithdraw,

        /// Incorrect funding amount.
        ZeroFundingAmount,

        /// There is not enough balance for a stake.
        InsufficientBalanceForStake,

        /// The conflicting stake discovered. Cannot stake.
        ConflictingStakes,

        /// Stake cannot be empty with this bounty.
        EmptyStake,
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

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
            let bounty_creator_manager = BountyCreatorManager::<T>::get_bounty_creator(
                origin,
                params.creator.clone()
            )?;

            bounty_creator_manager.validate_balance_sufficiency(params.cherry, params.creator_funding)?;

            Self::ensure_create_bounty_parameters_valid(&params)?;

            //
            // == MUTATION SAFE ==
            //

            let next_bounty_count_value = Self::bounty_count() + 1;
            let bounty_id = T::BountyId::from(next_bounty_count_value);

            bounty_creator_manager.transfer_funds_to_bounty_account(
                bounty_id,
                params.cherry,
                params.creator_funding
            )?;

            let created_bounty_milestone = Self::get_bounty_milestone_on_creation(&params);

            let bounty = Bounty::<T> {
                total_funding: params.creator_funding,
                creation_params: params.clone(),
                milestone: created_bounty_milestone,
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
        pub fn cancel_bounty(origin, creator: BountyCreator<MemberId<T>>, bounty_id: T::BountyId) {
            let bounty_creator_manager = BountyCreatorManager::<T>::get_bounty_creator(
                origin,
                creator.clone(),
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            bounty_creator_manager.validate_creator(&bounty.creation_params.creator)?;

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
        #[weight = WeightInfoBounty::<T>::fund_bounty()]
        pub fn fund_bounty(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
            amount: BalanceOf<T>
        ) {
            let controller_account_id =
                T::MemberOriginValidator::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            ensure!(amount > Zero::zero(), Error::<T>::ZeroFundingAmount);

            ensure!(
                Self::check_balance_for_account(amount, &controller_account_id),
                Error::<T>::InsufficientBalanceForBounty
            );

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::Funding{..}),
                Error::<T>::InvalidBountyStage,
            );

            //
            // == MUTATION SAFE ==
            //

            Self::transfer_funds_to_bounty_account(&controller_account_id, bounty_id, amount)?;

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
            let funds_so_far = Self::contribution_by_bounty_by_member(bounty_id, member_id);
            let total_funding = funds_so_far.saturating_add(amount);
            <BountyContributions<T>>::insert(bounty_id, member_id, total_funding);

            // Fire events.
            Self::deposit_event(RawEvent::BountyFunded(bounty_id, member_id, amount));
            if  maximum_funding_reached{
                Self::deposit_event(RawEvent::BountyMaxFundingReached(bounty_id));
            }
        }

        /// Withdraw member funding.
        /// # <weight>
        ///
        /// ## weight
        /// `O (1)`
        /// - db:
        ///    - `O(1)` doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoBounty::<T>::withdraw_member_funding()]
        pub fn withdraw_member_funding(
            origin,
            member_id: MemberId<T>,
            bounty_id: T::BountyId,
        ) {
            let account_id = T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin, member_id,
            )?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::Withdrawal{..}),
                Error::<T>::InvalidBountyStage,
            );

            ensure!(
                <BountyContributions<T>>::contains_key(bounty_id, member_id),
                Error::<T>::NotBountyFunder,
            );

            let funding_amount = <BountyContributions<T>>::get(bounty_id, member_id);
            let cherry_fraction = Self::get_cherry_fraction_for_member(&bounty, funding_amount);
            let withdrawal_amount = funding_amount + cherry_fraction;

            //
            // == MUTATION SAFE ==
            //

            Self::transfer_funds_from_bounty_account(&account_id, bounty_id, withdrawal_amount)?;

            <BountyContributions<T>>::remove(bounty_id, member_id);

            Self::deposit_event(RawEvent::BountyMemberFundingWithdrawal(bounty_id, member_id));

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
        #[weight = WeightInfoBounty::<T>::withdraw_creator_funding_by_member()
              .max(WeightInfoBounty::<T>::withdraw_creator_funding_by_council())]
        pub fn withdraw_creator_funding(
            origin,
            creator: BountyCreator<MemberId<T>>,
            bounty_id: T::BountyId,
        ) {
            let bounty_creator_manager = BountyCreatorManager::<T>::get_bounty_creator(
                origin,
                creator.clone(),
            )?;

            let mut bounty = Self::ensure_bounty_exists(&bounty_id)?;

            bounty_creator_manager.validate_creator(&bounty.creation_params.creator)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);

            if let BountyStage::Withdrawal {creator_funds_need_withdrawal, cherry_needs_withdrawal} =
                current_bounty_stage
            {
                ensure!(
                    creator_funds_need_withdrawal || cherry_needs_withdrawal,
                    Error::<T>::NothingToWithdraw,
                );
            } else {
                return Err(Error::<T>::InvalidBountyStage.into());
            };

            //
            // == MUTATION SAFE ==
            //

            let funding_amount = bounty.creation_params.creator_funding;
            let cherry = Self::get_cherry_for_creator_withdrawal(&bounty, current_bounty_stage);

            bounty_creator_manager.transfer_funds_from_bounty_account(
                bounty_id,
                funding_amount,
                cherry
            )?;

            bounty.milestone = BountyMilestone::CreatorFundsWithdrawn;
            <Bounties<T>>::insert(bounty_id, bounty.clone());

            Self::deposit_event(RawEvent::BountyCreatorFundingWithdrawal(bounty_id, creator));

            let new_bounty_stage = Self::get_bounty_stage(&bounty);

            if Self::withdrawal_completed(&new_bounty_stage, &bounty_id) {
                Self::remove_bounty(&bounty_id);
            }
        }

        /// Withdraw creator funding.
        #[weight = 10_000_000]
        pub fn announce_work_entry(
            origin,
            member_id: MemberId<T>,
            staking_account_id: Option<T::AccountId>,
            bounty_id: T::BountyId,
        ) {
            T::MemberOriginValidator::ensure_member_controller_account_origin(origin, member_id)?;

            let bounty = Self::ensure_bounty_exists(&bounty_id)?;

            let current_bounty_stage = Self::get_bounty_stage(&bounty);
            ensure!(
                matches!(current_bounty_stage, BountyStage::WorkSubmission),
                Error::<T>::InvalidBountyStage,
            );

            Self::validate_entrant_stake(&bounty, staking_account_id.clone())?;

            //
            // == MUTATION SAFE ==
            //

            let next_entry_count_value = Self::work_entry_count() + 1;
            let entry_id = T::WorkEntryId::from(next_entry_count_value);

            let entry = WorkEntry::<T> {
                bounty_id,
                member_id,
                staking_account_id: staking_account_id.clone()
            };

            <WorkEntries<T>>::insert(entry_id, entry);
            WorkEntryCount::mutate(|count| {
                *count = next_entry_count_value
            });

            Self::deposit_event(RawEvent::WorkEntryAnnounced(
                bounty_id,
                member_id,
                staking_account_id,
                entry_id,
            ));
        }
    }
}

// Helper enum for the bounty management.
enum BountyCreatorManager<T: Trait> {
    // Bounty was created by a council.
    Council,

    // Bounty was created by a member.
    Member(T::AccountId, MemberId<T>),
}

impl<T: Trait> BountyCreatorManager<T> {
    // Construct BountyCreator by extrinsic origin and optional member_id.
    fn get_bounty_creator(
        origin: T::Origin,
        creator: BountyCreator<MemberId<T>>,
    ) -> Result<BountyCreatorManager<T>, DispatchError> {
        match creator {
            BountyCreator::Member(member_id) => {
                let account_id = T::MemberOriginValidator::ensure_member_controller_account_origin(
                    origin, member_id,
                )?;

                Ok(BountyCreatorManager::Member(account_id, member_id))
            }
            BountyCreator::Council => {
                ensure_root(origin)?;

                Ok(BountyCreatorManager::Council)
            }
        }
    }

    // Validate balance is sufficient for the bounty
    fn validate_balance_sufficiency(
        &self,
        cherry: BalanceOf<T>,
        creator_funding: BalanceOf<T>,
    ) -> DispatchResult {
        let required_balance = cherry + creator_funding;

        let balance_is_sufficient = match self {
            BountyCreatorManager::Council => {
                BountyCreatorManager::<T>::check_council_budget(required_balance)
            }
            BountyCreatorManager::Member(account_id, _) => {
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

    // Validate that provided creator relates to the initial BountyCreator.
    fn validate_creator(&self, creator: &BountyCreator<MemberId<T>>) -> DispatchResult {
        let initial_creator = match self {
            BountyCreatorManager::Council => BountyCreator::Council,
            BountyCreatorManager::Member(_, member_id) => BountyCreator::Member(*member_id),
        };

        ensure!(
            initial_creator == creator.clone(),
            Error::<T>::NotBountyCreator
        );

        Ok(())
    }

    // Transfer funds for the bounty creation.
    fn transfer_funds_to_bounty_account(
        &self,
        bounty_id: T::BountyId,
        cherry: BalanceOf<T>,
        creator_funding: BalanceOf<T>,
    ) -> DispatchResult {
        let required_balance = cherry + creator_funding;

        match self {
            BountyCreatorManager::Council => {
                BountyCreatorManager::<T>::transfer_balance_from_council_budget(
                    bounty_id,
                    required_balance,
                );
            }
            BountyCreatorManager::Member(account_id, _) => {
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
        cherry: BalanceOf<T>,
        creator_funding: BalanceOf<T>,
    ) -> DispatchResult {
        let required_balance = cherry + creator_funding;

        match self {
            BountyCreatorManager::Council => {
                BountyCreatorManager::<T>::transfer_balance_to_council_budget(
                    bounty_id,
                    required_balance,
                );
            }
            BountyCreatorManager::Member(account_id, _) => {
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
    fn current_block() -> T::BlockNumber {
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

    // Computes the stage of a bounty based on its creation parameters and the current state.
    fn get_bounty_stage(bounty: &Bounty<T>) -> BountyStage {
        let now = Self::current_block();
        let funding_was_provided = bounty.creation_params.creator_funding != Zero::zero();
        let cherry_is_not_zero = bounty.creation_params.cherry != Zero::zero();

        match bounty.milestone {
            // Funding period. No contributions or some contributions.
            BountyMilestone::Created {
                has_contributions,
                created_at,
            } => {
                // Limited funding period.
                if let Some(funding_period) = bounty.creation_params.funding_period {
                    // Funding period is not over.
                    if created_at + funding_period >= now {
                        BountyStage::Funding { has_contributions }
                    } else {
                        // Funding period expired.
                        if bounty.total_funding >= bounty.creation_params.min_amount {
                            // Minimum funding amount reached.
                            BountyStage::WorkSubmission
                        } else {
                            // Funding failed.
                            BountyStage::Withdrawal {
                                creator_funds_need_withdrawal: funding_was_provided,
                                cherry_needs_withdrawal: cherry_is_not_zero && !has_contributions,
                            }
                        }
                    }
                } else {
                    // Perpetual funding.
                    BountyStage::Funding { has_contributions }
                }
            }
            // Bounty was canceled or vetoed.
            BountyMilestone::Canceled => BountyStage::Withdrawal {
                creator_funds_need_withdrawal: funding_was_provided,
                cherry_needs_withdrawal: cherry_is_not_zero,
            },
            // It is withdrawal stage and the creator don't expect any withdrawals.
            BountyMilestone::CreatorFundsWithdrawn => BountyStage::Withdrawal {
                creator_funds_need_withdrawal: false,
                cherry_needs_withdrawal: false,
            },
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
                reached_on_creation,
            } => {
                // Work period is not over.
                if bounty.creation_params.work_period + max_funding_reached_at <= now {
                    BountyStage::WorkSubmission
                } else {
                    // Work period is over.
                    // TODO: change to judging stage when it will be introduced
                    BountyStage::Withdrawal {
                        creator_funds_need_withdrawal: funding_was_provided,
                        cherry_needs_withdrawal: reached_on_creation && cherry_is_not_zero,
                    }
                }
            }
        }
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
        //We don't count creator_funding.
        let total_funding = bounty
            .total_funding
            .saturating_sub(bounty.creation_params.creator_funding);

        let funding_share = Perbill::from_rational_approximation(funding_amount, total_funding);

        // cherry share
        funding_share * bounty.creation_params.cherry
    }

    // Calculate cherry to withdraw by bounty creator.
    fn get_cherry_for_creator_withdrawal(bounty: &Bounty<T>, stage: BountyStage) -> BalanceOf<T> {
        if let BountyStage::Withdrawal {
            cherry_needs_withdrawal,
            ..
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
                    creator_funds_need_withdrawal: false,
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

    // Calculates bounty milestone on creation.
    fn get_bounty_milestone_on_creation(
        params: &BountyCreationParameters<T>,
    ) -> BountyMilestone<T::BlockNumber> {
        let now = Self::current_block();

        // Whether the bounty is fully funded on creation.
        if params.creator_funding < params.max_amount {
            BountyMilestone::Created {
                created_at: now,
                has_contributions: false, // just created - no contributions
            }
        } else {
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at: now,
                reached_on_creation: true,
            }
        }
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
                reached_on_creation: false, // reached only now
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

    // Validates stake on announcing the work entry.
    fn validate_entrant_stake(
        bounty: &Bounty<T>,
        staking_account_id: Option<T::AccountId>,
    ) -> DispatchResult {
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
            } else {
                return Err(Error::<T>::EmptyStake.into());
            }
        }

        Ok(())
    }
}
