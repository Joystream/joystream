//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl blog::WeightInfo for WeightInfo {
    fn create_post(t: u32, b: u32) -> Weight {
        (317_873_000 as Weight)
            .saturating_add((92_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((129_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn lock_post() -> Weight {
        (160_756_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn unlock_post() -> Weight {
        (158_932_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn edit_post(t: u32, b: u32) -> Weight {
        (384_273_000 as Weight)
            .saturating_add((95_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((131_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn create_reply_to_post(t: u32) -> Weight {
        (591_784_000 as Weight)
            .saturating_add((161_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn create_reply_to_reply(t: u32) -> Weight {
        (508_330_000 as Weight)
            .saturating_add((160_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn edit_reply(t: u32) -> Weight {
        (281_077_000 as Weight)
            .saturating_add((160_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_replies(i: u32) -> Weight {
        (492_001_000 as Weight)
            .saturating_add((352_154_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
