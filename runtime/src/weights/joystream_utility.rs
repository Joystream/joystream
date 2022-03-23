//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl joystream_utility::WeightInfo for WeightInfo {
    fn execute_signal_proposal(i: u32) -> Weight {
        (108_316_000 as Weight).saturating_add((177_000 as Weight).saturating_mul(i as Weight))
    }
    fn update_working_group_budget_positive() -> Weight {
        (191_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative() -> Weight {
        (197_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn burn_account_tokens() -> Weight {
        (262_000_000 as Weight)
    }
}
