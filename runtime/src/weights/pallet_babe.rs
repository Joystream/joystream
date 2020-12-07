//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl pallet_babe::WeightInfo for WeightInfo {
    // WARNING! Some components were not used: ["x"]
    fn check_equivocation_proof() -> Weight {
        (379_669_000 as Weight)
    }
}
