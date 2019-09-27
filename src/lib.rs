// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Decode, Encode};
use runtime_primitives::traits::{AccountIdConversion, Zero};
use runtime_primitives::ModuleId;
use srml_support::traits::{Currency, ExistenceRequirement, Get, Imbalance, WithdrawReason};
use srml_support::{decl_module, decl_storage, ensure, StorageMap, StorageValue};

use rstd::collections::btree_map::BTreeMap;
use system;

mod mock;
mod tests;

pub type StakeId = u64;
pub const FIRST_STAKE_ID: u64 = 1;

pub type SlashId = u64;
pub const FIRST_SLASH_ID: u64 = 1;

pub type BalanceOf<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

pub type NegativeImbalance<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

pub trait Trait: system::Trait + Sized {
    /// The currency that is managed by the module
    type Currency: Currency<Self::AccountId>;

    /// ModuleId for computing deterministic AccountId for the module
    type StakePoolId: Get<[u8; 8]>;

    /// Type that will handle various staking events
    type StakingEventsHandler: StakingEventsHandler<Self>;
}

pub trait StakingEventsHandler<T: Trait> {
    // Type of handler which handles unstaking event.
    fn unstaked(id: &StakeId, unstaked_amount: NegativeImbalance<T>) -> NegativeImbalance<T>;

    // Type of handler which handles slashing event.
    // NB: actually_slashed can be less than amount of the slash itself if the
    // claim amount on the stake cannot cover it fully.
    fn slashed(
        id: &StakeId,
        slash_id: &SlashId,
        actually_slashed: NegativeImbalance<T>,
        remaining_stake: BalanceOf<T>,
    ) -> NegativeImbalance<T>;
}

// Default implementation just destroys the unstaked or slashed
impl<T: Trait> StakingEventsHandler<T> for () {
    fn unstaked(_id: &StakeId, _amount: NegativeImbalance<T>) -> NegativeImbalance<T> {
        NegativeImbalance::<T>::zero()
    }
    fn slashed(
        _id: &StakeId,
        _slash_id: &SlashId,
        _amount: NegativeImbalance<T>,
        _remaining_stake: BalanceOf<T>,
    ) -> NegativeImbalance<T> {
        NegativeImbalance::<T>::zero()
    }
}

// Helper so we can provide multiple handlers
impl<T: Trait, X: StakingEventsHandler<T>, Y: StakingEventsHandler<T>> StakingEventsHandler<T>
    for (X, Y)
{
    fn unstaked(id: &StakeId, amount: NegativeImbalance<T>) -> NegativeImbalance<T> {
        let remaining = X::unstaked(id, amount);
        Y::unstaked(id, remaining)
    }
    fn slashed(
        id: &StakeId,
        slash_id: &SlashId,
        amount: NegativeImbalance<T>,
        remaining_stake: BalanceOf<T>,
    ) -> NegativeImbalance<T> {
        let remaining = X::slashed(id, slash_id, amount, remaining_stake);
        Y::slashed(id, slash_id, remaining, remaining_stake)
    }
}

#[derive(Encode, Decode, Debug, Default, Eq, PartialEq)]
pub struct Slash<BlockNumber, Balance> {
    // The block slashing was initiated.
    started_at_block: BlockNumber,

    // Whether slashing is in active, or conversley paused state
    // Blocks are only counted towards slashing execution delay when active.
    is_active: bool,

    // The number blocks which must be finalised while in the active period before the slashing can be executed
    blocks_remaining_in_active_period_for_slashing: BlockNumber,

    // Amount to slash
    slash_amount: Balance,
}

#[derive(Encode, Decode, Debug, Default, Eq, PartialEq)]
pub struct UnstakingState<BlockNumber> {
    // The block where the unstaking was initiated
    started_in_block: BlockNumber,

    // Whether unstaking is in active, or conversely paused state
    // Blocks are only counted towards unstaking period when active.
    is_active: bool,

    // The number blocks which must be finalised while in the active period before the unstaking is finished
    blocks_remaining_in_active_period_for_unstaking: BlockNumber,
}

#[derive(Encode, Decode, Debug, Eq, PartialEq)]
pub enum StakedStatus<BlockNumber> {
    // Baseline staking status, nothing is happening.
    Normal,

    // Unstaking is under way
    Unstaking(UnstakingState<BlockNumber>),
}

impl<BlockNumber> Default for StakedStatus<BlockNumber> {
    fn default() -> Self {
        StakedStatus::Normal
    }
}

#[derive(Encode, Decode, Debug, Default, Eq, PartialEq)]
pub struct StakedState<BlockNumber, Balance> {
    // Total amount of funds at stake
    staked_amount: Balance,

    // All ongoing slashing process.
    // There may be some issue with BTreeMap for now in Polkadotjs,
    // consider replacing this with Vec<Slash<T>>, and remove nextSlashId from state, for now in that case,
    ongoing_slashes: BTreeMap<SlashId, Slash<BlockNumber, Balance>>,

    // Status of the staking
    staked_status: StakedStatus<BlockNumber>,
}

#[derive(Encode, Decode, Debug, Eq, PartialEq)]
pub enum StakingStatus<BlockNumber, Balance> {
    NotStaked,

    Staked(StakedState<BlockNumber, Balance>),
}

impl<BlockNumber, Balance> Default for StakingStatus<BlockNumber, Balance> {
    fn default() -> Self {
        StakingStatus::NotStaked
    }
}

#[derive(Encode, Decode, Default, Debug, Eq, PartialEq)]
pub struct Stake<BlockNumber, Balance> {
    // When role was created
    created: BlockNumber,

    // Status of any possible ongoing staking
    staking_status: StakingStatus<BlockNumber, Balance>,
}

decl_storage! {
    trait Store for Module<T: Trait> as StakePool {
        /// Maps identifiers to a stake.
        Stakes get(stakes): map StakeId => Stake<T::BlockNumber, BalanceOf<T>>;

        /// Identifier value for next stake.
        NextStakeId get(next_stake_id): StakeId = FIRST_STAKE_ID;

        /// Identifier value for next slashing.
        NextSlashId get(next_slash_id): SlashId = FIRST_SLASH_ID;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn on_finalize(now: T::BlockNumber) {
            Self::finalize_unstaking_and_slashing(now);
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
pub enum StakingError {
    StakeNotFound,
    SlashNotFound,
    StakingLessThanMinimumBalance,
    InsufficientBalance,
    InsufficientStake,
    ChangingStakeByZero,
    AlreadyStaked,
    AlreadyUnstaking,
    NotStaked,
    NotUnstaking,
    IncreasingStakeWhileUnstaking,
    DecreasingStakeWhileUnstaking,
    DecreasingStakeWhileOngoingSlahes,
    InitiatingUnstakingWhileSlashesOngoing,
}

impl<T: Trait> Module<T> {
    /// The account ID of the stake pool.
    ///
    /// This actually does computation. If you need to keep using it, then make sure you cache the
    /// value and only call this once. Is it deterministic?
    pub fn staking_fund_account_id() -> T::AccountId {
        ModuleId(T::StakePoolId::get()).into_account()
    }

    pub fn staking_fund_balance() -> BalanceOf<T> {
        T::Currency::free_balance(&Self::staking_fund_account_id())
    }

    /// Adds a new Stake which is NotStaked, created at given block, into stakes map with id NextStakeId, and increments NextStakeId.
    pub fn create_stake() -> StakeId {
        let id = Self::next_stake_id();
        <Stakes<T>>::insert(
            &id,
            Stake {
                created: <system::Module<T>>::block_number(),
                staking_status: Default::default(),
            },
        );
        NextStakeId::mutate(|id| *id += 1);
        id
    }

    /// Given that stake with id exists in stakes and is NotStaked, remove from stakes.
    pub fn remove_stake(stake_id: &StakeId) {
        if <Stakes<T>>::exists(stake_id)
            && StakingStatus::NotStaked == Self::stakes(stake_id).staking_status
        {
            <Stakes<T>>::remove(stake_id);
        }
    }

    /// Dry run to see if staking can be initiated for the specified stake id. This should
    /// be called before stake() to make sure staking is possible before withdrawing funds.
    pub fn ensure_can_stake(stake_id: &StakeId, value: BalanceOf<T>) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        ensure!(
            Self::stakes(stake_id).staking_status == StakingStatus::NotStaked,
            StakingError::AlreadyStaked
        );
        ensure!(value > Zero::zero(), StakingError::ChangingStakeByZero);
        ensure!(
            value > T::Currency::minimum_balance(),
            StakingError::StakingLessThanMinimumBalance
        );
        Ok(())
    }

    /// Provided the stake exists and is in state NotStaked the value is transferred
    /// to the module's account, and the corresponding staked_balance is set to this amount in the new Staked state.
    /// If staking fails the value is lost, make sure to call can_stake() prior to ensure this doesn't happen.
    pub fn stake(stake_id: &StakeId, value: NegativeImbalance<T>) -> Result<(), StakingError> {
        let amount = value.peek();

        Self::ensure_can_stake(stake_id, amount)?;

        Self::deposit_funds_into_pool(value);

        Self::set_normal_staked_state(stake_id, amount);

        Ok(())
    }

    pub fn stake_from_account(
        stake_id: &StakeId,
        source_account_id: &T::AccountId,
        value: BalanceOf<T>,
    ) -> Result<(), StakingError> {
        Self::ensure_can_stake(stake_id, value)?;

        Self::move_funds_into_pool_from_account(source_account_id, value)?;

        Self::set_normal_staked_state(stake_id, value);

        Ok(())
    }

    fn set_normal_staked_state(stake_id: &StakeId, value: BalanceOf<T>) {
        assert!(Self::ensure_can_stake(stake_id, value).is_ok());
        <Stakes<T>>::mutate(stake_id, |stake| {
            stake.staking_status = StakingStatus::Staked(StakedState {
                staked_amount: value,
                ongoing_slashes: BTreeMap::new(),
                staked_status: StakedStatus::Normal,
            });
        });
    }

    /// Moves funds from specified account into the module's account
    /// We don't use T::Currency::transfer() to prevent fees being incurred.
    fn move_funds_into_pool_from_account(
        source: &T::AccountId,
        value: BalanceOf<T>,
    ) -> Result<(), StakingError> {
        let negative_imbalance = T::Currency::withdraw(
            source,
            value,
            WithdrawReason::Transfer,
            ExistenceRequirement::AllowDeath,
        )
        .map_err(|_err| StakingError::InsufficientBalance)?;

        Self::deposit_funds_into_pool(negative_imbalance);
        Ok(())
    }

    fn deposit_funds_into_pool(value: NegativeImbalance<T>) {
        // move the negative imbalance into the stake pool
        T::Currency::resolve_creating(&Self::staking_fund_account_id(), value);
    }

    /// Moves funds from the module's account into specified account.
    /// We don't use T::Currency::transfer() to prevent fees being incurred.
    fn withdraw_funds_from_pool_into_account(destination: &T::AccountId, value: BalanceOf<T>) {
        let imbalance = Self::withdraw_funds_from_pool(value);
        T::Currency::resolve_creating(destination, imbalance);
    }

    fn withdraw_funds_from_pool(value: BalanceOf<T>) -> NegativeImbalance<T> {
        assert!(Self::staking_fund_balance() >= value);
        T::Currency::withdraw(
            &Self::staking_fund_account_id(),
            value,
            WithdrawReason::Transfer,
            ExistenceRequirement::AllowDeath,
        )
        .expect("pool had less than expected funds!")
    }

    /// Provided the stake exists and is in state Staked.Normal, and the given source account covers the amount,
    /// then the amount is transferred to the module's account, and the corresponding staked_amount is increased
    /// by the amount. New value of staked_amount is returned.
    pub fn increase_stake_from_account(
        stake_id: &StakeId,
        staker_account_id: &T::AccountId,
        value: BalanceOf<T>,
    ) -> Result<BalanceOf<T>, StakingError> {
        Self::ensure_can_increase_stake(stake_id, value)?;

        let mut stake = Self::stakes(stake_id);

        Self::move_funds_into_pool_from_account(&staker_account_id, value)?;

        let total_staked_amount = Self::_increase_stake(&mut stake, value);

        <Stakes<T>>::insert(stake_id, stake);

        Ok(total_staked_amount)
    }

    /// Checks the state of stake to ensure that increasing stake is possible. This should be called
    /// before attempting to increase stake with an imbalance to avoid the value from the imbalance
    /// from being lost
    pub fn ensure_can_increase_stake(
        stake_id: &StakeId,
        value: BalanceOf<T>,
    ) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        ensure!(value > Zero::zero(), StakingError::ChangingStakeByZero);
        match Self::stakes(stake_id).staking_status {
            StakingStatus::NotStaked => Err(StakingError::NotStaked),
            StakingStatus::Staked(staked_state) => match staked_state.staked_status {
                StakedStatus::Normal => Ok(()),
                StakedStatus::Unstaking(_) => Err(StakingError::IncreasingStakeWhileUnstaking),
            },
        }
    }

    /// Provided the stake exists and is in state Staked.Normal, then the amount is transferred to the module's account,
    /// and the corresponding staked_amount is increased
    /// by the value. New value of staked_amount is returned.
    pub fn increase_stake(
        stake_id: &StakeId,
        value: NegativeImbalance<T>,
    ) -> Result<BalanceOf<T>, StakingError> {
        Self::ensure_can_increase_stake(stake_id, value.peek())?;

        let mut stake = Self::stakes(stake_id);

        let total_staked_amount = Self::_increase_stake(&mut stake, value.peek());

        Self::deposit_funds_into_pool(value);

        <Stakes<T>>::insert(stake_id, stake);

        Ok(total_staked_amount)
    }

    fn _increase_stake(
        stake: &mut Stake<T::BlockNumber, BalanceOf<T>>,
        value: BalanceOf<T>,
    ) -> BalanceOf<T> {
        match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => match staked_state.staked_status {
                StakedStatus::Normal => {
                    staked_state.staked_amount += value;
                    staked_state.staked_amount
                }
                _ => {
                    panic!();
                }
            },
            _ => {
                panic!();
            }
        }
    }

    /// Provided the stake exists and is in state Staked.Normal, and the given stake holds at least the amount,
    /// then the amount is transferred to from the module's account to the staker account, and the corresponding
    /// staked_amount is decreased by the amount. New value of staked_amount is returned.
    pub fn decrease_stake(
        id: &StakeId,
        destination_account_id: &T::AccountId,
        value: BalanceOf<T>,
    ) -> Result<BalanceOf<T>, StakingError> {
        ensure!(<Stakes<T>>::exists(id), StakingError::StakeNotFound);

        ensure!(value > Zero::zero(), StakingError::ChangingStakeByZero);

        let mut stake = Self::stakes(id);

        let (deduct_from_pool, staked_amount) = match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => match staked_state.staked_status {
                StakedStatus::Normal => {
                    // prevent decreasing stake if there is at least one onging slash
                    if staked_state
                        .ongoing_slashes
                        .values()
                        .any(|slash| slash.is_active)
                    {
                        return Err(StakingError::DecreasingStakeWhileOngoingSlahes);
                    }

                    if value > staked_state.staked_amount {
                        return Err(StakingError::InsufficientStake);
                    }

                    let stake_to_reduce =
                        if staked_state.staked_amount - value < T::Currency::minimum_balance() {
                            // If staked amount would drop below minimum balance, deduct the entire stake
                            staked_state.staked_amount
                        } else {
                            value
                        };

                    staked_state.staked_amount -= stake_to_reduce;

                    (stake_to_reduce, staked_state.staked_amount)
                }
                _ => return Err(StakingError::DecreasingStakeWhileUnstaking),
            },
            _ => return Err(StakingError::NotStaked),
        };

        Self::withdraw_funds_from_pool_into_account(&destination_account_id, deduct_from_pool);

        <Stakes<T>>::insert(id, stake);

        Ok(staked_amount)
    }

    // Initiate a new slashing of a staked stake.
    pub fn initiate_slashing(
        stake_id: &StakeId,
        slash_amount: BalanceOf<T>,
        slash_period: T::BlockNumber,
    ) -> Result<SlashId, StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        let mut stake = Self::stakes(stake_id);

        let slash_id = match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => {
                let slash_id = NextSlashId::mutate(|next_id| {
                    let id = *next_id;
                    *next_id += 1;
                    id
                });

                staked_state.ongoing_slashes.insert(
                    slash_id,
                    Slash {
                        is_active: true,
                        blocks_remaining_in_active_period_for_slashing: slash_period,
                        slash_amount,
                        started_at_block: <system::Module<T>>::block_number(),
                    },
                );

                // pause Unstaking if unstaking is active
                match staked_state.staked_status {
                    StakedStatus::Unstaking(ref mut unstaking_state) => {
                        unstaking_state.is_active = false;
                    }
                    _ => (),
                }

                slash_id
            }
            _ => return Err(StakingError::NotStaked),
        };

        <Stakes<T>>::insert(stake_id, stake);

        Ok(slash_id)
    }

    // Pause an ongoing slashing
    pub fn pause_slashing(stake_id: &StakeId, slash_id: &SlashId) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        let mut stake = Self::stakes(stake_id);

        match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => {
                match staked_state.ongoing_slashes.get_mut(slash_id) {
                    Some(ref mut slash) => {
                        if slash.is_active {
                            slash.is_active = false;
                            <Stakes<T>>::insert(stake_id, stake);
                        }
                        Ok(())
                    }
                    _ => Err(StakingError::SlashNotFound),
                }
            }
            _ => Err(StakingError::NotStaked),
        }
    }

    // Resume a currently paused ongoing slashing.
    pub fn resume_slashing(stake_id: &StakeId, slash_id: &SlashId) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        let mut stake = Self::stakes(stake_id);

        match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => {
                match staked_state.ongoing_slashes.get_mut(slash_id) {
                    Some(ref mut slash) => {
                        if !slash.is_active {
                            slash.is_active = true;
                            <Stakes<T>>::insert(stake_id, stake);
                        }
                        Ok(())
                    }
                    _ => Err(StakingError::SlashNotFound),
                }
            }
            _ => Err(StakingError::NotStaked),
        }
    }

    // Cancel an ongoing slashing (regardless of whether its active or paused).
    pub fn cancel_slashing(stake_id: &StakeId, slash_id: &SlashId) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        let mut stake = Self::stakes(stake_id);

        match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => {
                if staked_state.ongoing_slashes.remove(slash_id).is_none() {
                    return Err(StakingError::SlashNotFound);
                }

                // unpause unstaking on last ongoing slash cancelled
                if staked_state.ongoing_slashes.is_empty() {
                    match staked_state.staked_status {
                        StakedStatus::Unstaking(ref mut unstaking_state) => {
                            unstaking_state.is_active = true;
                        }
                        _ => (),
                    }
                }

                <Stakes<T>>::insert(stake_id, stake);
                Ok(())
            }
            _ => Err(StakingError::NotStaked),
        }
    }

    // Initiate unstaking of a staked stake.
    pub fn initiate_unstaking(
        stake_id: &StakeId,
        unstaking_period: T::BlockNumber,
    ) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        let mut stake = Self::stakes(stake_id);

        if let StakingStatus::Staked(ref mut staked_state) = stake.staking_status {
            // prevent unstaking if there is at least one active slashing
            if staked_state
                .ongoing_slashes
                .values()
                .any(|slash| slash.is_active)
            {
                return Err(StakingError::InitiatingUnstakingWhileSlashesOngoing);
            }

            if StakedStatus::Normal == staked_state.staked_status {
                return Err(StakingError::AlreadyUnstaking);
            }

            staked_state.staked_status = StakedStatus::Unstaking(UnstakingState {
                started_in_block: <system::Module<T>>::block_number(),
                is_active: true,
                blocks_remaining_in_active_period_for_unstaking: unstaking_period,
            });

            <Stakes<T>>::insert(stake_id, stake);

            return Ok(());
        } else {
            return Err(StakingError::NotStaked);
        }
    }

    // Pause an ongoing unstaking.
    pub fn pause_unstaking(stake_id: &StakeId) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        let mut stake = Self::stakes(stake_id);

        match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => match staked_state.staked_status {
                StakedStatus::Unstaking(ref mut unstaking_state) => {
                    if unstaking_state.is_active {
                        unstaking_state.is_active = false;
                        <Stakes<T>>::insert(stake_id, stake);
                    }
                    Ok(())
                }
                _ => Err(StakingError::NotUnstaking),
            },
            _ => Err(StakingError::NotStaked),
        }
    }

    // Continue a currently paused ongoing unstaking.
    pub fn resume_unstaking(stake_id: &StakeId) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        let mut stake = Self::stakes(stake_id);

        match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => match staked_state.staked_status {
                StakedStatus::Unstaking(ref mut unstaking_state) => {
                    if !unstaking_state.is_active {
                        unstaking_state.is_active = true;
                        <Stakes<T>>::insert(stake_id, stake);
                    }
                    Ok(())
                }
                _ => Err(StakingError::NotUnstaking),
            },
            _ => Err(StakingError::NotStaked),
        }
    }

    /*
      Handle timers for finalizing unstaking and slashing.
      Finalised unstaking results in the staked_balance in the given stake to be transferred.
      Finalised slashing results in the staked_balance in the given stake being correspondingly reduced.
    */
    fn finalize_unstaking_and_slashing(_now: T::BlockNumber) {
        for stake_id in FIRST_STAKE_ID..Self::next_stake_id() {
            if !<Stakes<T>>::exists(stake_id) {
                continue;
            }

            let mut stake = Self::stakes(stake_id);

            if let StakingStatus::Staked(ref mut staked_state) = stake.staking_status {
                // tick the slashing timer and find slashes to be finalized
                let slashes_to_finalize: Vec<SlashId> = staked_state
                    .ongoing_slashes
                    .iter_mut()
                    .map(|(slash_id, slash)| {
                        if slash.is_active
                            && slash.blocks_remaining_in_active_period_for_slashing > Zero::zero()
                        {
                            slash.blocks_remaining_in_active_period_for_slashing -=
                                T::BlockNumber::from(1);
                        }
                        (slash_id, slash)
                    })
                    .filter(|(_slash_id, slash)| {
                        slash.is_active
                            && slash.blocks_remaining_in_active_period_for_slashing == Zero::zero()
                    })
                    .map(|(slash_id, _slash)| *slash_id)
                    .collect();
                // didn't find a way to remove a value from btreemap while iterating over it :(

                // slash
                for slash_id in slashes_to_finalize.iter() {
                    assert!(staked_state.ongoing_slashes.contains_key(slash_id));
                    let slash = staked_state.ongoing_slashes.remove(slash_id).unwrap();

                    let mut slash_amount = if slash.slash_amount > staked_state.staked_amount {
                        staked_state.staked_amount
                    } else {
                        slash.slash_amount
                    };

                    staked_state.staked_amount -= slash_amount;

                    // don't leave less than minimum balance at stake
                    if staked_state.staked_amount < T::Currency::minimum_balance() {
                        slash_amount += staked_state.staked_amount;
                        staked_state.staked_amount = Zero::zero();
                    }

                    // remove the slashed amount from the pool
                    let imbalance = Self::withdraw_funds_from_pool(slash_amount);
                    assert_eq!(imbalance.peek(), slash_amount);

                    let _ = T::StakingEventsHandler::slashed(
                        &stake_id,
                        slash_id,
                        imbalance,
                        staked_state.staked_amount,
                    );
                }

                if let StakedStatus::Unstaking(ref mut unstaking_state) = staked_state.staked_status
                {
                    // if all slashes were processed and there are no more active slashes
                    // resume unstaking
                    if staked_state.ongoing_slashes.is_empty() {
                        unstaking_state.is_active = true;
                    }

                    if unstaking_state.is_active
                        && unstaking_state.blocks_remaining_in_active_period_for_unstaking
                            > Zero::zero()
                    {
                        // tick the timer
                        unstaking_state.blocks_remaining_in_active_period_for_unstaking -=
                            T::BlockNumber::from(1);
                    }

                    if unstaking_state.blocks_remaining_in_active_period_for_unstaking
                        == Zero::zero()
                    {
                        // withdraw the stake from the pool
                        let imbalance = Self::withdraw_funds_from_pool(staked_state.staked_amount);
                        assert_eq!(imbalance.peek(), staked_state.staked_amount);

                        let _ = T::StakingEventsHandler::unstaked(&stake_id, imbalance);

                        stake.staking_status = StakingStatus::NotStaked;
                    }
                }
            }

            <Stakes<T>>::insert(&stake_id, stake);
        }
    }
}
