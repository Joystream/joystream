//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl pallet_im_online::WeightInfo for WeightInfo {
    fn validate_unsigned_and_then_heartbeat(k: u32, e: u32) -> Weight {
        (0 as Weight)
            .saturating_add((16_930_000 as Weight).saturating_mul(k as Weight))
            .saturating_add((26_243_000 as Weight).saturating_mul(e as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
