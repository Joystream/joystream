// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

use core::hash::Hash;
use core::ops::AddAssign;

use codec::{Codec, Decode, Encode};
use frame_support::storage::IterableStorageMap;

use frame_support::{
    decl_event, decl_module, decl_storage,
    dispatch::{DispatchError, DispatchResult},
    ensure,
    traits::Get,
    Parameter,
};
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{MaybeSerializeDeserialize, Member};
use sp_std::borrow::ToOwned;
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use sp_std::vec;
use sp_std::vec::Vec;
use system::ensure_signed;

/// Module configuration trait for this Substrate module.
pub trait Trait: system::Trait + ActorAuthenticator + Clone {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Type of identifier for Videos
    type VideoId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + Hash
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    /// Type of identifier for Channels
    type ChannelId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + Hash
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    // Security/configuration constraints

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup: Get<MaxNumber>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Content {


    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Initializing events
        fn deposit_event() = default;

    }
}

impl<T: Trait> Module<T> {

}

decl_event!(
    pub enum Event<T>
    where
        CuratorGroupId = <T as ActorAuthenticator>::CuratorGroupId,
        CuratorId = <T as ActorAuthenticator>::CuratorId,
    {

    }
);

decl_error! {
    /// Content directory errors
    pub enum Error for Module<T: Trait> {

    }
}