//! This pallet works with crowd funded bounties that allows a member, or the council, to crowd
//! fund work on projects with a public benefit.
//!
//! A detailed description could be found [here](https://github.com/Joystream/joystream/issues/1998).
//!
//! ### Supported extrinsics:
//! - [create_bounty](./struct.Module.html#method.create_bounty) - creates a bounty
//! - [cancel_bounty](./struct.Module.html#method.cancel_bounty) - cancels a bounty
//! - [veto_bounty](./struct.Module.html#method.veto_bounty) - vetoes a bounty

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(test)]
pub(crate) mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

// TODO: add max entries limit
// TODO: benchmark all bounty creation parameters
// TODO: add assertion for the created bounty object content

/// pallet_bounty WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn create_bounty_by_council() -> Weight;
    fn create_bounty_by_member() -> Weight;
    fn cancel_bounty_by_member() -> Weight;
    fn cancel_bounty_by_council() -> Weight;
    fn veto_bounty() -> Weight;
    fn fund_bounty() -> Weight;
}

type WeightInfoBounty<T> = <T as Trait>::WeightInfo;

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::Currency;
use frame_support::weights::Weight;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
use frame_system::ensure_root;
use sp_arithmetic::traits::Saturating;
use sp_arithmetic::traits::Zero;
use sp_std::vec::Vec;

use common::council::CouncilBudgetManager;
use common::origin::MemberOriginValidator;
use common::MemberId;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Main pallet-bounty trait.
pub trait Trait: frame_system::Trait + balances::Trait + common::Trait {
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Bounty Id type
    type BountyId: From<u32> + Parameter + Default + Copy;

    /// Validates member ID and origin combination.
    type MemberOriginValidator: MemberOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Provides an access for the council budget.
    type CouncilBudgetManager: CouncilBudgetManager<BalanceOf<Self>>;
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

    /// Bounty creator member ID, should be None if created by a council.
    pub creator_member_id: Option<MemberId>,

    /// An mount of funding, possibly 0, provided by the creator which will be split among all other
    /// contributors should the min funding bound not be reached. If reached, cherry is returned to
    /// the creator. When council is creating bounty, this comes out of their budget, when a member
    /// does it, it comes from an account.
    pub cherry: Balance,

    /// The minimum total quantity of funds, possibly 0, required for the bounty to become
    /// available for people to work on.
    pub min_amount: Balance,

    /// Maximumm funding accepted, if this limit is reached, funding automatically is over.
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

/// Defines current bounty stage.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum BountyStage<BlockNumber> {
    /// Bounty founding stage with starting block number.
    Funding(BlockNumber),

    /// A bounty was canceled.
    Canceled,

    /// A bounty was vetoed.
    Vetoed,

    /// A bounty funding was successful on the provided block.
    /// It is optional stage and is set when the funding exceeded max funding amount.
    MaxFundingReached(BlockNumber),
}

impl<BlockNumber: Default> Default for BountyStage<BlockNumber> {
    fn default() -> Self {
        BountyStage::Funding(Default::default())
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

    /// The current bounty stage.
    pub stage: BountyStage<BlockNumber>,

    /// The current unspent "cherry" balance.
    pub cherry_pot: Balance,

    /// The current unspent funding balance.
    pub current_funding: Balance,
}

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

decl_storage! {
    trait Store for Module<T: Trait> as Bounty {
        /// Bounty storage
        pub Bounties get(fn bounties) : map hasher(blake2_128_concat) T::BountyId => Bounty<T>;

        /// Count of all bounties that have been created.
        pub BountyCount get(fn bounty_count): u32;
    }
}

decl_event! {
    pub enum Event<T>
    where
        <T as Trait>::BountyId,
        Balance = BalanceOf<T>,
    {
        /// A bounty was created.
        BountyCreated(BountyId),

        /// A bounty was canceled.
        BountyCanceled(BountyId),

        /// A bounty was vetoed.
        BountyVetoed(BountyId),

        /// A bounty was vetoed.
        BountyFunded(BountyId, Balance),

        /// A bounty has reached its maximum funding amount.
        MaxFundingReached(BountyId),
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

        /// Funding period expired for the bounty.
        FundingPeriodExpired,
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
            let bounty_creator = BountyCreator::<T>::get_bounty_creator(
                origin,
                params.creator_member_id
            )?;

            bounty_creator.validate_balance_sufficiency(params.cherry, params.creator_funding)?;

            Self::ensure_create_bounty_parameters_valid(&params)?;

            //
            // == MUTATION SAFE ==
            //

            bounty_creator.slash_balance(params.cherry, params.creator_funding);

            let next_bounty_count_value = Self::bounty_count() + 1;
            let bounty_id = T::BountyId::from(next_bounty_count_value);

            let bounty = Bounty::<T> {
                cherry_pot: params.cherry,
                current_funding: params.creator_funding,
                creation_params: params,
                stage: BountyStage::Funding(Self::current_block()),
            };

            <Bounties<T>>::insert(bounty_id, bounty);
            BountyCount::mutate(|count| {
                *count += 1
            });
            Self::deposit_event(RawEvent::BountyCreated(bounty_id));
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
        pub fn cancel_bounty(origin, creator_member_id: Option<MemberId<T>>, bounty_id: T::BountyId) {
            let bounty_creator = BountyCreator::<T>::get_bounty_creator(
                origin,
                creator_member_id
            )?;

            ensure!(
                <Bounties<T>>::contains_key(bounty_id),
                Error::<T>::BountyDoesntExist
            );

            let bounty = <Bounties<T>>::get(bounty_id);

            bounty_creator.validate_creator(&bounty.creation_params.creator_member_id)?;

            ensure!(
                matches!(bounty.stage, BountyStage::Funding(_)),
                Error::<T>::InvalidBountyStage,
            );

            //
            // == MUTATION SAFE ==
            //

            // TODO: make payments for submitted work. Change stage to Canceled.

            <Bounties<T>>::remove(bounty_id);
            Self::deposit_event(RawEvent::BountyCanceled(bounty_id));
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

            ensure!(
                <Bounties<T>>::contains_key(bounty_id),
                Error::<T>::BountyDoesntExist
            );

            let bounty = <Bounties<T>>::get(bounty_id);

            ensure!(
                matches!(bounty.stage, BountyStage::Funding(_)),
                Error::<T>::InvalidBountyStage,
            );

            //
            // == MUTATION SAFE ==
            //

            // TODO: make payments for submitted work. Change stage to vetoed.

            <Bounties<T>>::remove(bounty_id);
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
            let account_id = T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin, member_id,
            )?;

            ensure!(
                <Bounties<T>>::contains_key(bounty_id),
                Error::<T>::BountyDoesntExist
            );

            let mut bounty = <Bounties<T>>::get(bounty_id);

            ensure!(
                Self::check_balance_for_account(amount, &account_id),
                Error::<T>::InsufficientBalanceForBounty
            );

            if let BountyStage::Funding(created_at) = bounty.stage{
                if let Some(funding_period) = bounty.creation_params.funding_period {
                    ensure!(
                        created_at + funding_period >= Self::current_block(),
                        Error::<T>::FundingPeriodExpired,
                    );
            }
            } else {
                return Err(Error::<T>::InvalidBountyStage.into())
            }

            //
            // == MUTATION SAFE ==
            //

            Self::slash_balance_from_account(amount, &account_id);

            bounty.current_funding = bounty.current_funding.saturating_add(amount);

            let maximum_funding_reached =
                bounty.current_funding >= bounty.creation_params.max_amount;
            if  maximum_funding_reached{
                bounty.stage = BountyStage::MaxFundingReached(Self::current_block());
            }

            <Bounties<T>>::insert(bounty_id, bounty);

            Self::deposit_event(RawEvent::BountyFunded(bounty_id, amount));
            if  maximum_funding_reached{
                Self::deposit_event(RawEvent::MaxFundingReached(bounty_id));
            }
        }
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
}

// Helper enum for the bounty management.
enum BountyCreator<T: Trait> {
    // Bounty was created by a council.
    Council,

    // Bounty was created by a member.
    Member(T::AccountId, MemberId<T>),
}

impl<T: Trait> BountyCreator<T> {
    // Construct BountyCreator by extrinsic origin and optional member_id.
    fn get_bounty_creator(
        origin: T::Origin,
        creator_member_id: Option<MemberId<T>>,
    ) -> Result<BountyCreator<T>, DispatchError> {
        if let Some(member_id) = creator_member_id {
            let account_id = T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin, member_id,
            )?;

            Ok(BountyCreator::Member(account_id, member_id))
        } else {
            ensure_root(origin)?;

            Ok(BountyCreator::Council)
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
            BountyCreator::Council => BountyCreator::<T>::check_council_budget(required_balance),
            BountyCreator::Member(account_id, _) => {
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

    // Validate that provided creator_member_id relates to the initial BountyCreator.
    // Eg.: It could test saved bounty creator_member_id with the extrinsic's origin and optional
    // creator_member_id.
    fn validate_creator(&self, creator_member_id: &Option<MemberId<T>>) -> DispatchResult {
        let creator_validated = match self {
            BountyCreator::Council => BountyCreator::<T>::created_by_council(creator_member_id),
            BountyCreator::Member(_, member_id) => {
                BountyCreator::<T>::created_by_member(*member_id, creator_member_id)
            }
        };

        ensure!(creator_validated, Error::<T>::NotBountyCreator);

        Ok(())
    }

    // Verifies that provided creator_member_id is correct for the bounty created by a council.
    fn created_by_council(creator_member_id: &Option<MemberId<T>>) -> bool {
        creator_member_id.is_none()
    }

    // Verifies that provided creator_member_id relates to the bounty creator member ID..
    fn created_by_member(member_id: MemberId<T>, creator_member_id: &Option<MemberId<T>>) -> bool {
        creator_member_id
            .map(|creator_member_id| member_id == creator_member_id)
            .unwrap_or(false)
    }

    // Slash a balance for the bounty creation.
    fn slash_balance(&self, cherry: BalanceOf<T>, creator_funding: BalanceOf<T>) {
        let required_balance = cherry + creator_funding;

        match self {
            BountyCreator::Council => {
                BountyCreator::<T>::remove_balance_from_council_budget(required_balance);
            }
            BountyCreator::Member(account_id, _) => {
                Module::<T>::slash_balance_from_account(required_balance, account_id);
            }
        }
    }

    // Remove a balance from the council budget.
    fn remove_balance_from_council_budget(amount: BalanceOf<T>) {
        let budget = T::CouncilBudgetManager::get_budget();
        let new_budget = budget.saturating_sub(amount);

        T::CouncilBudgetManager::set_budget(new_budget);
    }
}

impl<T: Trait> Module<T> {
    // Verifies that member balance is sufficient for a bounty.
    fn check_balance_for_account(amount: BalanceOf<T>, account_id: &T::AccountId) -> bool {
        balances::Module::<T>::usable_balance(account_id) >= amount
    }

    // Slash a balance from the member controller account.
    fn slash_balance_from_account(amount: BalanceOf<T>, account_id: &T::AccountId) {
        let _ = balances::Module::<T>::slash(account_id, amount);
    }
}
