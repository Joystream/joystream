//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_engine::WeightInfo for WeightInfo {
    fn vote(i: u32) -> Weight {
        (375_240_000 as Weight)
            .saturating_add((35_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn cancel_proposal(i: u32) -> Weight {
        (874_300_000 as Weight)
            .saturating_add((1_713_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(8 as Weight))
    }
    fn veto_proposal() -> Weight {
        (404_254_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(8 as Weight))
    }
    fn on_initialize_immediate_execution_decode_fails(i: u32) -> Weight {
        (22_531_000 as Weight)
            .saturating_add((578_486_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((7 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_pending_execution_decode_fails(i: u32) -> Weight {
        (31_944_000 as Weight)
            .saturating_add((274_852_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((5 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_approved_pending_constitutionality(i: u32) -> Weight {
        (50_422_000 as Weight)
            .saturating_add((250_210_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rejected(i: u32) -> Weight {
        (0 as Weight)
            .saturating_add((884_947_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((7 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_slashed(i: u32) -> Weight {
        (24_867_000 as Weight)
            .saturating_add((628_899_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((7 as Weight).saturating_mul(i as Weight)))
    }
}
