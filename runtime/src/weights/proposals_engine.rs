//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_engine::WeightInfo for WeightInfo {
    fn vote(i: u32) -> Weight {
        (10_707_315_000 as Weight)
            .saturating_add((1_075_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn cancel_proposal(i: u32) -> Weight {
        (27_737_659_000 as Weight)
            .saturating_add((38_762_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(8 as Weight))
    }
    fn veto_proposal() -> Weight {
        (13_460_881_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(8 as Weight))
    }
    fn on_initialize_immediate_execution_decode_fails(i: u32) -> Weight {
        (845_226_000 as Weight)
            .saturating_add((18_757_457_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((7 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_approved_pending_constitutionality(i: u32) -> Weight {
        (1_194_100_000 as Weight)
            .saturating_add((8_103_583_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rejected(i: u32) -> Weight {
        (751_079_000 as Weight)
            .saturating_add((27_189_652_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((7 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_slashed(i: u32) -> Weight {
        (1_297_364_000 as Weight)
            .saturating_add((20_346_415_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((7 as Weight).saturating_mul(i as Weight)))
    }
}
