//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl referendum::WeightInfo for WeightInfo {
    fn on_initialize_revealing(i: u32) -> Weight {
        (256_993_000 as Weight)
            .saturating_add((5_242_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn on_initialize_voting() -> Weight {
        (145_807_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn vote() -> Weight {
        (443_261_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn reveal_vote_space_for_new_winner(i: u32) -> Weight {
        (501_934_000 as Weight)
            .saturating_add((12_406_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn reveal_vote_space_not_in_winners(i: u32) -> Weight {
        (557_731_000 as Weight)
            .saturating_add((7_068_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn reveal_vote_space_replace_last_winner(i: u32) -> Weight {
        (470_304_000 as Weight)
            .saturating_add((9_542_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn reveal_vote_already_existing(i: u32) -> Weight {
        (503_012_000 as Weight)
            .saturating_add((9_931_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn release_vote_stake() -> Weight {
        (387_201_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
