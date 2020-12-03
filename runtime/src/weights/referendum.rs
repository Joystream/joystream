//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl referendum::WeightInfo for WeightInfo {
    fn on_finalize_revealing(i: u32) -> Weight {
        (162_562_000 as Weight)
            .saturating_add((3_788_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn on_finalize_voting() -> Weight {
        (107_830_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn vote() -> Weight {
        (413_778_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn reveal_vote_space_for_new_winner(i: u32) -> Weight {
        (516_980_000 as Weight)
            .saturating_add((7_355_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn reveal_vote_space_not_in_winners(i: u32) -> Weight {
        (379_026_000 as Weight)
            .saturating_add((6_028_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn reveal_vote_space_replace_last_winner(i: u32) -> Weight {
        (395_050_000 as Weight)
            .saturating_add((6_563_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn reveal_vote_already_existing(i: u32) -> Weight {
        (816_985_000 as Weight)
            .saturating_add((5_962_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn release_vote_stake() -> Weight {
        (460_316_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
