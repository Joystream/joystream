// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Decode, Encode};
use runtime_primitives::traits::{AccountIdConversion, Zero};
use runtime_primitives::ModuleId;
use srml_support::traits::{Currency, Get};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, StorageMap, StorageValue,
};

use rstd::collections::btree_map::BTreeMap;
use system;

mod mock;

pub type StakeId = u64;
pub const FIRST_STAKE_ID: u64 = 1;

pub type SlashId = u64;
pub const FIRST_SLASH_ID: u64 = 1;

pub type BalanceOf<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

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
    fn unstaked(id: StakeId);

    // Type of handler which handles slashing event.
    // NB: actually_slashed can be less than amount of the slash itself if the
    // claim amount on the stake cannot cover it fully.
    fn slashed(id: StakeId, slash_id: SlashId, actually_slashed: BalanceOf<T>);
}

impl<T: Trait> StakingEventsHandler<T> for () {
    fn unstaked(_id: StakeId) {}
    fn slashed(_id: StakeId, _slash_id: SlashId, _actually_slashed: BalanceOf<T>) {}
}

// Helper so we can provide multiple handlers
impl<T: Trait, X: StakingEventsHandler<T>, Y: StakingEventsHandler<T>> StakingEventsHandler<T>
    for (X, Y)
{
    fn unstaked(id: StakeId) {
        X::unstaked(id);
        Y::unstaked(id);
    }
    fn slashed(id: StakeId, slash_id: SlashId, actually_slashed: BalanceOf<T>) {
        X::slashed(id, slash_id, actually_slashed);
        Y::slashed(id, slash_id, actually_slashed);
    }
}

#[derive(Encode, Decode)]
pub struct Slash<BlockNumber> {
    // rename to SlashingState ?

    // The block slashing was initiated.
    started_at_block: BlockNumber,

    // Whether slashing is in active, or conversley paused state
    // Blocks are only counted towards slashing execution delay when active.
    is_active: bool,

    // The number blocks which must be finalised while in the active period before the slashing can be executed
    blocks_remaining_in_active_period_for_slashing: BlockNumber,
}

#[derive(Encode, Decode)]
pub struct UnstakingState<BlockNumber> {
    // The block where the unstaking was initiated
    started_in_block: BlockNumber,

    // Whether unstaking is in active, or conversely paused state
    // Blocks are only counted towards unstaking period when active.
    is_active: bool,

    // The number blocks which must be finalised while in the active period before the unstaking is finished
    blocks_remaining_in_active_period_for_unstaking: BlockNumber,
}

#[derive(Encode, Decode)]
pub enum StakedStatus<BlockNumber> {
    // Baseline staking status, nothing is happening.
    Normal,

    // Unstaking is under way
    Unstaking(UnstakingState<BlockNumber>),
}

#[derive(Encode, Decode)]
pub struct StakedState<BlockNumber, Balance> {
    // Total amount of funds at stake
    staked_amount: Balance,

    // All ongoing slashing process.
    // There may be some issue with BTreeMap for now in Polkadotjs,
    // consider replacing this with Vec<Slash<T>>, and remove nextSlashId from state, for now in that case,
    ongoing_slashes: BTreeMap<SlashId, Slash<BlockNumber>>,

    // Status of the staking
    staked_status: StakedStatus<BlockNumber>,
}

#[derive(Encode, Decode)]
pub enum StakingStatus<BlockNumber, Balance> {
    NotStaked,

    Staked(StakedState<BlockNumber, Balance>),
}

impl<BlockNumber, Balance> Default for StakingStatus<BlockNumber, Balance> {
    fn default() -> Self {
        StakingStatus::NotStaked
    }
}

#[derive(Encode, Decode, Default)]
pub struct Stake<BlockNumber, Balance> {
    // When role was created
    created: BlockNumber,

    // Status of any possible ongoing staking
    staking_status: StakingStatus<BlockNumber, Balance>,
}

decl_storage! {
    trait Store for Module<T: Trait> as StakePool {
        /// Maps identifiers to a stake.
        Stakes get(stakes) : map StakeId => Stake<T::BlockNumber, BalanceOf<T>>;

        /// Identifier value for next stake.
        NextStakeId get(next_stake_id):  StakeId = FIRST_STAKE_ID;

        /// Identifier value for next slashing.
        NextSlashId get(next_slash_id): SlashId = FIRST_SLASH_ID;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn on_finalize(now: T::BlockNumber) {}
    }
}

impl<T: Trait> Module<T> {
    /// The account ID of the stake pool.
    ///
    /// This actually does computation. If you need to keep using it, then make sure you cache the
    /// value and only call this once.
    pub fn staking_fund_account_id() -> T::AccountId {
        ModuleId(T::StakePoolId::get()).into_account()
    }

    pub fn staking_fund_balance() -> BalanceOf<T> {
        T::Currency::free_balance(&Self::staking_fund_account_id())
    }
}
