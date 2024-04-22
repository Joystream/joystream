#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(unused_parens)]
#![allow(unused_imports)]
#![allow(unused_variables)]

use frame_support::{traits::Get, weights::Weight};
use sp_std::marker::PhantomData;

/// Weight functions needed for project_token.
pub trait WeightInfo {
    fn request_outbound_transfer() -> Weight;

    fn finalize_inbound_transfer() -> Weight;

    fn pause_bridge() -> Weight;

    fn init_unpause_bridge() -> Weight;

    fn finish_unpause_bridge() -> Weight;

    fn update_bridge_constrains() -> Weight;
}

/// Weights for project_token using the Substrate node and recommended hardware.
pub struct SubstrateWeight<T>(PhantomData<T>);
impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {

    fn request_outbound_transfer() -> Weight 
    {
        Weight::from_parts(10_506_000, 0u64)
			.saturating_add(Weight::from_parts(0, 0))
			.saturating_add(T::DbWeight::get().writes(1_u64))
    }

    fn finalize_inbound_transfer() -> Weight 
    {
        Weight::from_parts(10_506_000, 0u64)
			.saturating_add(Weight::from_parts(0, 0))
			.saturating_add(T::DbWeight::get().writes(1_u64))
    }

    fn pause_bridge() -> Weight 
    {
        Weight::from_parts(10_506_000, 0u64)
			.saturating_add(Weight::from_parts(0, 0))
			.saturating_add(T::DbWeight::get().writes(1_u64))
    }

    fn init_unpause_bridge() -> Weight 
    {
        Weight::from_parts(10_506_000, 0u64)
			.saturating_add(Weight::from_parts(0, 0))
			.saturating_add(T::DbWeight::get().writes(1_u64))
    }

    fn finish_unpause_bridge() -> Weight 
    {
        Weight::from_parts(10_506_000, 0u64)
			.saturating_add(Weight::from_parts(0, 0))
			.saturating_add(T::DbWeight::get().writes(1_u64))
    }

    fn update_bridge_constrains() -> Weight 
    {
        Weight::from_parts(10_506_000, 0u64)
			.saturating_add(Weight::from_parts(0, 0))
			.saturating_add(T::DbWeight::get().writes(1_u64))
    }
}