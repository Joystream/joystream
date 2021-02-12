//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl blog::WeightInfo for WeightInfo {
    fn create_post(t: u32, b: u32) -> Weight {
        (355_638_000 as Weight)
            .saturating_add((151_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((189_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn lock_post() -> Weight {
        (205_726_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn unlock_post() -> Weight {
        (200_216_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn edit_post(t: u32, b: u32) -> Weight {
        (497_924_000 as Weight)
            .saturating_add((142_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((197_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn create_reply_to_post(t: u32) -> Weight {
        (354_299_000 as Weight)
            .saturating_add((245_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn create_reply_to_reply(t: u32) -> Weight {
        (407_973_000 as Weight)
            .saturating_add((245_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn edit_reply(t: u32) -> Weight {
        (317_997_000 as Weight)
            .saturating_add((252_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
