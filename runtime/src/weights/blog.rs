//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl blog::WeightInfo for WeightInfo {
    fn create_post(t: u32, b: u32) -> Weight {
        (496_105_000 as Weight)
            .saturating_add((88_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((150_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn lock_post() -> Weight {
        (169_763_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn unlock_post() -> Weight {
        (169_042_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn edit_post(t: u32, b: u32) -> Weight {
        (561_965_000 as Weight)
            .saturating_add((94_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((134_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn create_reply_to_post(t: u32) -> Weight {
        (581_402_000 as Weight)
            .saturating_add((189_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn create_reply_to_reply(t: u32) -> Weight {
        (532_869_000 as Weight)
            .saturating_add((187_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn edit_reply(t: u32) -> Weight {
        (327_078_000 as Weight)
            .saturating_add((192_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_replies(i: u32) -> Weight {
        (93_653_000 as Weight)
            .saturating_add((446_908_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((2 as Weight).saturating_mul(i as Weight)))
    }
}
