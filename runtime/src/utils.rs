use crate::{
    Balance, DefaultStorageDepositCleanupProfit, ExistentialDeposit, MinimumBloatBondPerByte,
    Runtime, RuntimeCall, UncheckedExtrinsic,
};
use codec::{Encode, FullCodec, MaxEncodedLen};
use frame_support::{
    dispatch::GetDispatchInfo,
    storage::{
        generator::{StorageDoubleMap, StorageMap},
        StoragePrefixedMap,
    },
    traits::StorageInfoTrait,
    weights::{Weight, WeightToFee},
    StorageHasher,
};
pub use sp_runtime::Perbill;
use sp_std::mem::size_of;

/// The size of an encoded extrinsic signature ie. `(Address, Signature, Extra)`, assuming tip = 0
pub const ENCODED_EXTRINSIC_SIGNATURE_LENGTH: u64 = 102;

/// Compute total fee for executing a call
pub fn compute_fee(call: RuntimeCall) -> Balance {
    let xt = UncheckedExtrinsic::new_unsigned(call);
    let length = xt.encode().len() as u64 + ENCODED_EXTRINSIC_SIGNATURE_LENGTH;
    let dispatch_info = &<UncheckedExtrinsic as GetDispatchInfo>::get_dispatch_info(&xt);
    let weight_fee = <Runtime as pallet_transaction_payment::Config>::WeightToFee::weight_to_fee(
        &dispatch_info.weight,
    );
    let len_fee = <Runtime as pallet_transaction_payment::Config>::LengthToFee::weight_to_fee(
        &Weight::from_ref_time(length),
    );
    let base_fee = <Runtime as pallet_transaction_payment::Config>::WeightToFee::weight_to_fee(
        &<Runtime as frame_system::Config>::BlockWeights::get()
            .get(dispatch_info.class)
            .base_extrinsic,
    );
    base_fee.saturating_add(weight_fee).saturating_add(len_fee)
}

/// Compute a single bloat bond
pub fn compute_single_bloat_bond(total_byte_size: u32, forced_minimum: Option<Balance>) -> Balance {
    let min_bloat_bond =
        Balance::from(total_byte_size).saturating_mul(MinimumBloatBondPerByte::get());
    match forced_minimum {
        Some(forced_minimum) => min_bloat_bond.max(forced_minimum),
        None => min_bloat_bond,
    }
}

/// Compute a single bloat bond given storage entry size and cleanup transaction fee
pub fn single_bloat_bond_with_cleanup(
    total_byte_size: u32,
    max_cleanup_inclusion_fee: Balance,
    cleanup_profit: Balance,
) -> Balance {
    compute_single_bloat_bond(
        total_byte_size,
        Some(max_cleanup_inclusion_fee.saturating_add(cleanup_profit)),
    )
}

/// Compute a single bloat bond given storage entry size and cleanup transaction fee,
/// while forcing it to also be >= ExistentialDeposit::get()
pub fn single_existential_deposit_bloat_bond_with_cleanup(
    total_byte_size: u32,
    max_cleanup_inclusion_fee: Balance,
    cleanup_profit: Balance,
) -> Balance {
    let forced_minimum = max_cleanup_inclusion_fee
        .saturating_add(cleanup_profit)
        .max(ExistentialDeposit::get());
    compute_single_bloat_bond(total_byte_size, Some(forced_minimum))
}

/// Compute stake while being sensitive to cleanup transaction fee value
pub fn stake_with_cleanup(stake: Balance, max_cleanup_inclusion_fee: Balance) -> Balance {
    stake.max(max_cleanup_inclusion_fee.saturating_add(DefaultStorageDepositCleanupProfit::get()))
}

/// Compute size of a double map entry using fixed-size portion of the value type
pub fn double_map_entry_fixed_byte_size<Map, Hasher1, Key1, Hasher2, Key2, Value>() -> u32
where
    Map: StorageDoubleMap<Key1, Key2, Value, Hasher1 = Hasher1, Hasher2 = Hasher2>
        + StoragePrefixedMap<Value>,
    Hasher1: StorageHasher,
    Hasher2: StorageHasher,
    Key1: FullCodec + MaxEncodedLen,
    Key2: FullCodec + MaxEncodedLen,
    Value: FullCodec,
{
    Map::final_prefix()
        .len()
        .saturating_add(Hasher1::max_len::<Key1>())
        .saturating_add(Hasher2::max_len::<Key2>())
        .saturating_add(size_of::<Value>()) as u32
}

/// Compute size of a map entry using fixed-size portion of the value type
pub fn map_entry_fixed_byte_size<Map, Hasher, Key, Value>() -> u32
where
    Map: StorageMap<Key, Value, Hasher = Hasher> + StoragePrefixedMap<Value>,
    Hasher: StorageHasher,
    Key: FullCodec + MaxEncodedLen,
    Value: FullCodec,
{
    Map::final_prefix()
        .len()
        .saturating_add(Hasher::max_len::<Key>())
        .saturating_add(size_of::<Value>()) as u32
}

/// Compute maximum possible size of a map entry
pub fn map_entry_max_size<Map>() -> u32
where
    Map: StorageInfoTrait,
{
    let storage_info = Map::storage_info().pop().unwrap();
    (storage_info.prefix.len() as u32).saturating_add(storage_info.max_size.unwrap())
}

#[macro_export]
macro_rules! giga_bytes {
    ($a:expr) => {{
        (1024 * 1024 * 1024) * $a
    }};
}

#[macro_export]
macro_rules! mega_bytes {
    ($a:expr) => {{
        (1024 * 1024) * $a
    }};
}

#[macro_export]
macro_rules! minutes {
    ($a:expr) => {{
        ((60 * 1000) / ExpectedBlockTime::get()) as u32 * $a
    }};
}

#[macro_export]
macro_rules! hours {
    ($a:expr) => {{
        ((60 * 60 * 1000) / ExpectedBlockTime::get()) as u32 * $a
    }};
}

#[macro_export]
macro_rules! days {
    ($a:expr) => {{
        hours!(24) * $a
    }};
}

#[macro_export]
macro_rules! dollars {
    ($a:expr) => {{
        currency::DOLLARS * $a
    }};
}

#[macro_export]
macro_rules! cents {
    ($a:expr) => {{
        currency::CENTS * $a
    }};
}

#[macro_export]
macro_rules! monthly_dollars_to_per_block {
    ($a:expr) => {{
        dollars!($a).saturating_div(Balance::from(days!(30)))
    }};
}
