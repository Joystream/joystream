// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Codec, Decode, Encode};
use runtime_primitives::traits::{
    AccountIdConversion, MaybeSerializeDebug, Member, One, SimpleArithmetic, Zero,
};
use runtime_primitives::ModuleId;
use srml_support::traits::{Currency, ExistenceRequirement, Get, Imbalance, WithdrawReason};
use srml_support::{
    assert_ok, decl_module, decl_storage, ensure, EnumerableStorageMap, Parameter, StorageMap,
    StorageValue,
};

use rstd::collections::btree_map::BTreeMap;
use system;

mod mock;
mod tests;

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

    /// The type used as a stake identifier.
    type StakeId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq;

    /// The type used as slash identifier.
    type SlashId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq
        + Ord; //required to be a key in BTreeMap
}

pub trait StakingEventsHandler<T: Trait> {
    // Type of handler which handles unstaking event.
    fn unstaked(id: &T::StakeId, unstaked_amount: NegativeImbalance<T>) -> NegativeImbalance<T>;

    // Type of handler which handles slashing event.
    // NB: actually_slashed can be less than amount of the slash itself if the
    // claim amount on the stake cannot cover it fully.
    fn slashed(
        id: &T::StakeId,
        slash_id: &T::SlashId,
        actually_slashed: NegativeImbalance<T>,
        remaining_stake: BalanceOf<T>,
    ) -> NegativeImbalance<T>;
}

// Default implementation just destroys the unstaked or slashed
impl<T: Trait> StakingEventsHandler<T> for () {
    fn unstaked(_id: &T::StakeId, _amount: NegativeImbalance<T>) -> NegativeImbalance<T> {
        NegativeImbalance::<T>::zero()
    }
    fn slashed(
        _id: &T::StakeId,
        _slash_id: &T::SlashId,
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
    fn unstaked(id: &T::StakeId, amount: NegativeImbalance<T>) -> NegativeImbalance<T> {
        let remaining = X::unstaked(id, amount);
        Y::unstaked(id, remaining)
    }
    fn slashed(
        id: &T::StakeId,
        slash_id: &T::SlashId,
        amount: NegativeImbalance<T>,
        remaining_stake: BalanceOf<T>,
    ) -> NegativeImbalance<T> {
        let remaining = X::slashed(id, slash_id, amount, remaining_stake);
        Y::slashed(id, slash_id, remaining, remaining_stake)
    }
}

#[derive(Encode, Decode, Debug, Default, Eq, PartialEq, Clone)]
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
    started_at_block: BlockNumber,

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
pub struct StakedState<BlockNumber, Balance, SlashId: Ord> {
    /// Total amount of funds at stake
    staked_amount: Balance,

    /// Status of the staking
    staked_status: StakedStatus<BlockNumber>,

    /// SlashId to use for next Slash that is initiated.
    next_slash_id: SlashId,

    /// All ongoing slashing process.
    ongoing_slashes: BTreeMap<SlashId, Slash<BlockNumber, Balance>>,
}

impl<BlockNumber: SimpleArithmetic, Balance: SimpleArithmetic + Copy, SlashId: Ord + Copy>
    StakedState<BlockNumber, Balance, SlashId>
{
    fn advance_slashing_timer(&mut self) {
        for (_, slash) in self.ongoing_slashes.iter_mut() {
            if slash.is_active
                && slash.blocks_remaining_in_active_period_for_slashing > Zero::zero()
            {
                slash.blocks_remaining_in_active_period_for_slashing -= One::one();
            }
        }
    }

    fn get_slashes_to_finalize(&self) -> Vec<SlashId> {
        self.ongoing_slashes
            .iter()
            .filter(|(_, slash)| {
                slash.is_active
                    && slash.blocks_remaining_in_active_period_for_slashing == Zero::zero()
            })
            .map(|(slash_id, _)| *slash_id)
            .collect()
    }

    fn apply_slash(
        &mut self,
        slash: &Slash<BlockNumber, Balance>,
        minimum_balance: Balance,
    ) -> Balance {
        // calculate how much to slash
        let mut slash_amount = if slash.slash_amount > self.staked_amount {
            self.staked_amount
        } else {
            slash.slash_amount
        };

        // apply the slashing
        self.staked_amount -= slash_amount;

        // don't leave less than minimum_balance at stake
        if self.staked_amount < minimum_balance {
            slash_amount += self.staked_amount;
            self.staked_amount = Zero::zero();
        }

        slash_amount
    }
}

#[derive(Encode, Decode, Debug, Eq, PartialEq)]
pub enum StakingStatus<BlockNumber, Balance, SlashId: Ord> {
    NotStaked,

    Staked(StakedState<BlockNumber, Balance, SlashId>),
}

impl<BlockNumber, Balance, SlashId: Ord> Default for StakingStatus<BlockNumber, Balance, SlashId> {
    fn default() -> Self {
        StakingStatus::NotStaked
    }
}

#[derive(Encode, Decode, Default, Debug, Eq, PartialEq)]
pub struct Stake<BlockNumber, Balance, SlashId: Ord> {
    // When role was created
    created: BlockNumber,

    // Status of any possible ongoing staking
    staking_status: StakingStatus<BlockNumber, Balance, SlashId>,
}

impl<BlockNumber, Balance: Copy + SimpleArithmetic, SlashId: Ord>
    Stake<BlockNumber, Balance, SlashId>
{
    /// If staking status is staked and normal it will increase the staked amount by value.
    /// Returns error otherwise.
    fn try_increase_stake(&mut self, value: Balance) -> Result<Balance, StakingError> {
        ensure!(value > Zero::zero(), StakingError::ChangingStakeByZero);
        match self.staking_status {
            StakingStatus::Staked(ref mut staked_state) => match staked_state.staked_status {
                StakedStatus::Normal => {
                    staked_state.staked_amount += value;
                    Ok(staked_state.staked_amount)
                }
                _ => Err(StakingError::IncreasingStakeWhileUnstaking),
            },
            _ => Err(StakingError::NotStaked),
        }
    }

    fn try_decrease_stake(
        &mut self,
        value: Balance,
        minimum_balance: Balance,
    ) -> Result<(Balance, Balance), StakingError> {
        ensure!(value > Zero::zero(), StakingError::ChangingStakeByZero);
        match self.staking_status {
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

                    let stake_to_reduce = if staked_state.staked_amount - value < minimum_balance {
                        // If staked amount would drop below minimum balance, deduct the entire stake
                        staked_state.staked_amount
                    } else {
                        value
                    };

                    staked_state.staked_amount -= stake_to_reduce;

                    Ok((stake_to_reduce, staked_state.staked_amount))
                }
                _ => return Err(StakingError::DecreasingStakeWhileUnstaking),
            },
            _ => return Err(StakingError::NotStaked),
        }
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as StakePool {
        /// Maps identifiers to a stake.
        Stakes get(stakes): linked_map T::StakeId => Stake<T::BlockNumber, BalanceOf<T>, T::SlashId>;

        /// Identifier value for next stake.
        StakesCreated get(stakes_created): T::StakeId;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn on_finalize(_now: T::BlockNumber) {
            Self::finalize_unstaking_and_slashing();
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
pub enum StakingError {
    StakeNotFound,
    SlashNotFound,
    SlashNotPaused,
    SlashAlreadyPaused,
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
    UnstakingWhileSlashesOngoing,
    ZeroUnstakingPeriod,
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
    pub fn create_stake() -> T::StakeId {
        <StakesCreated<T>>::mutate(|id| {
            let stake_id = *id;
            *id += One::one();
            <Stakes<T>>::insert(
                &stake_id,
                Stake {
                    created: <system::Module<T>>::block_number(),
                    staking_status: Default::default(),
                },
            );
            stake_id
        })
    }

    /// Given that stake with id exists in stakes and is NotStaked, remove from stakes.
    pub fn remove_stake(stake_id: &T::StakeId) {
        if <Stakes<T>>::exists(stake_id)
            && StakingStatus::NotStaked == Self::stakes(stake_id).staking_status
        {
            <Stakes<T>>::remove(stake_id);
        }
    }

    /// Dry run to see if staking can be initiated for the specified stake id. This should
    /// be called before stake() to make sure staking is possible before withdrawing funds.
    pub fn ensure_can_stake(
        stake_id: &T::StakeId,
        value: BalanceOf<T>,
    ) -> Result<(), StakingError> {
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
    pub fn stake(stake_id: &T::StakeId, value: NegativeImbalance<T>) -> Result<(), StakingError> {
        let amount = value.peek();

        Self::ensure_can_stake(stake_id, amount)?;

        Self::deposit_funds_into_pool(value);

        Self::set_normal_staked_state(stake_id, amount);

        Ok(())
    }

    pub fn stake_from_account(
        stake_id: &T::StakeId,
        source_account_id: &T::AccountId,
        value: BalanceOf<T>,
    ) -> Result<(), StakingError> {
        Self::ensure_can_stake(stake_id, value)?;

        Self::transfer_funds_from_account_into_pool(source_account_id, value)?;

        Self::set_normal_staked_state(stake_id, value);

        Ok(())
    }

    fn set_normal_staked_state(stake_id: &T::StakeId, value: BalanceOf<T>) {
        assert_ok!(Self::ensure_can_stake(stake_id, value));
        <Stakes<T>>::mutate(stake_id, |stake| {
            stake.staking_status = StakingStatus::Staked(StakedState {
                staked_amount: value,
                next_slash_id: Zero::zero(),
                ongoing_slashes: BTreeMap::new(),
                staked_status: StakedStatus::Normal,
            });
        });
    }

    /// Moves funds from specified account into the module's account
    /// We don't use T::Currency::transfer() to prevent fees being incurred.
    fn transfer_funds_from_account_into_pool(
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
    fn transfer_funds_from_pool_into_account(destination: &T::AccountId, value: BalanceOf<T>) {
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

    /// Checks the state of stake to ensure that increasing stake is possible. This should be called
    /// before attempting to increase stake with an imbalance to avoid the value from the imbalance
    /// from being lost
    pub fn ensure_can_increase_stake(
        stake_id: &T::StakeId,
        value: BalanceOf<T>,
    ) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        Self::stakes(stake_id)
            .try_increase_stake(value)
            .err()
            .map_or(Ok(()), |err| Err(err))
    }

    fn try_increase_stake(
        stake_id: &T::StakeId,
        value: BalanceOf<T>,
    ) -> Result<BalanceOf<T>, StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        <Stakes<T>>::mutate(stake_id, |ref mut stake| stake.try_increase_stake(value))
    }

    /// Provided the stake exists and is in state Staked.Normal, then the amount is transferred to the module's account,
    /// and the corresponding staked_amount is increased by the value. New value of staked_amount is returned.
    /// Caller MUST make sure to check ensure_can_increase_stake() before calling this method to prevent loss of the
    /// value because the negative imbalance is not returned to caller on failure.
    pub fn increase_stake(
        stake_id: &T::StakeId,
        value: NegativeImbalance<T>,
    ) -> Result<BalanceOf<T>, StakingError> {
        let total_staked_amount = Self::try_increase_stake(stake_id, value.peek())?;

        Self::deposit_funds_into_pool(value);

        Ok(total_staked_amount)
    }

    /// Provided the stake exists and is in state Staked.Normal, and the given source account covers the amount,
    /// then the amount is transferred to the module's account, and the corresponding staked_amount is increased
    /// by the amount. New value of staked_amount is returned.
    pub fn increase_stake_from_account(
        stake_id: &T::StakeId,
        source_account_id: &T::AccountId,
        value: BalanceOf<T>,
    ) -> Result<BalanceOf<T>, StakingError> {
        // ensure state of stake allows increasing stake before withdrawing from source account
        Self::ensure_can_increase_stake(stake_id, value)?;

        Self::transfer_funds_from_account_into_pool(&source_account_id, value)?;

        let total_staked_amount = Self::try_increase_stake(stake_id, value)?;

        Ok(total_staked_amount)
    }

    pub fn ensure_can_decrease_stake(
        stake_id: &T::StakeId,
        value: BalanceOf<T>,
    ) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        Self::stakes(stake_id)
            .try_decrease_stake(value, T::Currency::minimum_balance())
            .err()
            .map_or(Ok(()), |err| Err(err))
    }

    fn try_decrease_stake(
        stake_id: &T::StakeId,
        value: BalanceOf<T>,
    ) -> Result<(BalanceOf<T>, BalanceOf<T>), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        <Stakes<T>>::mutate(stake_id, |stake| {
            stake.try_decrease_stake(value, T::Currency::minimum_balance())
        })
    }

    pub fn decrease_stake(
        stake_id: &T::StakeId,
        value: BalanceOf<T>,
    ) -> Result<(BalanceOf<T>, NegativeImbalance<T>), StakingError> {
        let (deduct_from_pool, staked_amount) = Self::try_decrease_stake(stake_id, value)?;
        Ok((
            staked_amount,
            Self::withdraw_funds_from_pool(deduct_from_pool),
        ))
    }

    /// Provided the stake exists and is in state Staked.Normal, and the given stake holds at least the amount,
    /// then the amount is transferred to from the module's account to the staker account, and the corresponding
    /// staked_amount is decreased by the amount. New value of staked_amount is returned.
    pub fn decrease_stake_to_account(
        stake_id: &T::StakeId,
        destination_account_id: &T::AccountId,
        value: BalanceOf<T>,
    ) -> Result<BalanceOf<T>, StakingError> {
        let (deduct_from_pool, staked_amount) = Self::try_decrease_stake(stake_id, value)?;

        Self::transfer_funds_from_pool_into_account(&destination_account_id, deduct_from_pool);

        Ok(staked_amount)
    }

    // Initiate a new slashing of a staked stake.
    pub fn initiate_slashing(
        stake_id: &T::StakeId,
        slash_amount: BalanceOf<T>,
        slash_period: T::BlockNumber,
    ) -> Result<T::SlashId, StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        // ensure slash_period > 0
        <Stakes<T>>::mutate(stake_id, |stake| match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => {
                let slash_id = staked_state.next_slash_id;
                staked_state.next_slash_id = slash_id + One::one();

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

                Ok(slash_id)
            }
            _ => return Err(StakingError::NotStaked),
        })
    }

    // Pause an ongoing slashing
    pub fn pause_slashing(
        stake_id: &T::StakeId,
        slash_id: &T::SlashId,
    ) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        <Stakes<T>>::mutate(stake_id, |stake| match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => {
                match staked_state.ongoing_slashes.get_mut(slash_id) {
                    Some(ref mut slash) => {
                        if slash.is_active {
                            slash.is_active = false;
                            Ok(())
                        } else {
                            Err(StakingError::SlashAlreadyPaused)
                        }
                    }
                    _ => Err(StakingError::SlashNotFound),
                }
            }
            _ => Err(StakingError::NotStaked),
        })
    }

    // Resume a currently paused ongoing slashing.
    pub fn resume_slashing(
        stake_id: &T::StakeId,
        slash_id: &T::SlashId,
    ) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        <Stakes<T>>::mutate(stake_id, |stake| match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => {
                match staked_state.ongoing_slashes.get_mut(slash_id) {
                    Some(ref mut slash) => {
                        if slash.is_active {
                            Err(StakingError::SlashNotPaused)
                        } else {
                            slash.is_active = true;
                            Ok(())
                        }
                    }
                    _ => Err(StakingError::SlashNotFound),
                }
            }
            _ => Err(StakingError::NotStaked),
        })
    }

    // Cancel an ongoing slashing (regardless of whether its active or paused).
    pub fn cancel_slashing(
        stake_id: &T::StakeId,
        slash_id: &T::SlashId,
    ) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        <Stakes<T>>::mutate(stake_id, |stake| match stake.staking_status {
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

                Ok(())
            }
            _ => Err(StakingError::NotStaked),
        })
    }

    // Initiate unstaking of a staked stake.
    pub fn initiate_unstaking(
        stake_id: &T::StakeId,
        unstaking_period: T::BlockNumber,
    ) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);
        ensure!(
            unstaking_period > Zero::zero(),
            StakingError::ZeroUnstakingPeriod
        );

        <Stakes<T>>::mutate(stake_id, |stake| match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => {
                // prevent unstaking if there is at least one active slashing
                if staked_state
                    .ongoing_slashes
                    .values()
                    .any(|slash| slash.is_active)
                {
                    return Err(StakingError::UnstakingWhileSlashesOngoing);
                }

                if StakedStatus::Normal != staked_state.staked_status {
                    return Err(StakingError::AlreadyUnstaking);
                }

                staked_state.staked_status = StakedStatus::Unstaking(UnstakingState {
                    started_at_block: <system::Module<T>>::block_number(),
                    is_active: true,
                    blocks_remaining_in_active_period_for_unstaking: unstaking_period,
                });

                Ok(())
            }
            _ => Err(StakingError::NotStaked),
        })
    }

    // Pause an ongoing unstaking.
    pub fn pause_unstaking(stake_id: &T::StakeId) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        <Stakes<T>>::mutate(stake_id, |stake| match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => match staked_state.staked_status {
                StakedStatus::Unstaking(ref mut unstaking_state) => {
                    if unstaking_state.is_active {
                        unstaking_state.is_active = false;
                    }
                    Ok(())
                }
                _ => Err(StakingError::NotUnstaking),
            },
            _ => Err(StakingError::NotStaked),
        })
    }

    // Continue a currently paused ongoing unstaking.
    pub fn resume_unstaking(stake_id: &T::StakeId) -> Result<(), StakingError> {
        ensure!(<Stakes<T>>::exists(stake_id), StakingError::StakeNotFound);

        <Stakes<T>>::mutate(stake_id, |stake| match stake.staking_status {
            StakingStatus::Staked(ref mut staked_state) => match staked_state.staked_status {
                StakedStatus::Unstaking(ref mut unstaking_state) => {
                    if !unstaking_state.is_active {
                        unstaking_state.is_active = true;
                    }
                    Ok(())
                }
                _ => Err(StakingError::NotUnstaking),
            },
            _ => Err(StakingError::NotStaked),
        })
    }

    /*
      Handle timers for finalizing unstaking and slashing.
      Finalised unstaking results in the staked_balance in the given stake to be transferred.
      Finalised slashing results in the staked_balance in the given stake being correspondingly reduced.
    */
    fn finalize_unstaking_and_slashing() {
        for (stake_id, _) in <Stakes<T>>::enumerate() {
            <Stakes<T>>::mutate(stake_id, |stake| {
                if let StakingStatus::Staked(ref mut staked_state) = stake.staking_status {
                    // tick the slashing timer
                    staked_state.advance_slashing_timer();

                    // slash
                    for slash_id in staked_state.get_slashes_to_finalize().iter() {
                        assert!(staked_state.ongoing_slashes.contains_key(slash_id));
                        let slash = staked_state.ongoing_slashes.remove(slash_id).unwrap();

                        // apply the slashing and get back actual amount slashed
                        let slashed_amount =
                            staked_state.apply_slash(&slash, T::Currency::minimum_balance());

                        // remove the slashed amount from the pool
                        let imbalance = Self::withdraw_funds_from_pool(slashed_amount);
                        assert_eq!(imbalance.peek(), slashed_amount);

                        let _ = T::StakingEventsHandler::slashed(
                            &stake_id,
                            slash_id,
                            imbalance,
                            staked_state.staked_amount,
                        );
                    }

                    if let StakedStatus::Unstaking(ref mut unstaking_state) =
                        staked_state.staked_status
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
                                One::one();
                        }

                        if unstaking_state.blocks_remaining_in_active_period_for_unstaking
                            == Zero::zero()
                        {
                            // withdraw the stake from the pool
                            let imbalance =
                                Self::withdraw_funds_from_pool(staked_state.staked_amount);
                            assert_eq!(imbalance.peek(), staked_state.staked_amount);

                            let _ = T::StakingEventsHandler::unstaked(&stake_id, imbalance);

                            stake.staking_status = StakingStatus::NotStaked;
                        }
                    }
                }
            });
        }
    }
}
