//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl blog::WeightInfo for WeightInfo {
    fn create_post(t: u32, b: u32) -> Weight {
        (180_427_000 as Weight)
            .saturating_add((34_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((37_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn lock_post() -> Weight {
        (174_515_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn unlock_post() -> Weight {
        (174_369_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn edit_post(t: u32, b: u32) -> Weight {
        (333_244_000 as Weight)
            .saturating_add((38_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((31_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn create_reply_to_post(t: u32) -> Weight {
        (286_102_000 as Weight)
            .saturating_add((43_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn create_reply_to_reply(t: u32) -> Weight {
        (364_116_000 as Weight)
            .saturating_add((39_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn edit_reply(t: u32) -> Weight {
        (286_073_000 as Weight)
            .saturating_add((42_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn react_to_post() -> Weight {
        (244_186_000 as Weight).saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn react_to_reply() -> Weight {
        (311_256_000 as Weight).saturating_add(DbWeight::get().reads(3 as Weight))
    }
}
