//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl blog::WeightInfo for WeightInfo {
    fn create_post(t: u32, b: u32) -> Weight {
        (291_037_000 as Weight)
            .saturating_add((101_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((139_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn lock_post() -> Weight {
        (166_327_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn unlock_post() -> Weight {
        (164_654_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn edit_post(t: u32, b: u32) -> Weight {
        (464_651_000 as Weight)
            .saturating_add((99_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((134_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn create_reply_to_post(t: u32) -> Weight {
        (594_751_000 as Weight)
            .saturating_add((174_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn create_reply_to_reply(t: u32) -> Weight {
        (561_603_000 as Weight)
            .saturating_add((169_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn edit_reply(t: u32) -> Weight {
        (302_109_000 as Weight)
            .saturating_add((170_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_reply() -> Weight {
        (501_946_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
