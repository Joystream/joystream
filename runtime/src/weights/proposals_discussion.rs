//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_discussion::WeightInfo for WeightInfo {
    // WARNING! Some components were not used: ["i"]
    fn add_post(j: u32) -> Weight {
        (755_484_000 as Weight)
            .saturating_add((128_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn update_post(j: u32) -> Weight {
        (275_277_000 as Weight)
            .saturating_add((126_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_post() -> Weight {
        (550_197_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn change_thread_mode(i: u32) -> Weight {
        (350_305_000 as Weight)
            .saturating_add((1_891_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
