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
use system;

mod mock;

pub type StakeId = u64;
pub type SlashId = u64;

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

decl_storage! {
    trait Store for Module<T: Trait> as StakePool {

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
    pub fn account_id() -> T::AccountId {
        ModuleId(T::StakePoolId::get()).into_account()
    }

    pub fn balance() -> BalanceOf<T> {
        T::Currency::free_balance(&Self::account_id())
    }
}
