//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl pallet_constitution::WeightInfo for WeightInfo {
    fn amend_constitution(i: u32) -> Weight {
        (79_243_000 as Weight)
            .saturating_add((64_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
