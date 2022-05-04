//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl project_token::WeightInfo for WeightInfo {
    fn transfer(o: u32) -> Weight {
        (1_703_144_000 as Weight)
            .saturating_add((146_190_000 as Weight).saturating_mul(o as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(o as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(o as Weight)))
    }
    fn dust_account() -> Weight {
        (374_551_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn join_whitelist(h: u32) -> Weight {
        (558_164_000 as Weight)
            .saturating_add((14_159_000 as Weight).saturating_mul(h as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn purchase_tokens_on_sale() -> Weight {
        (961_902_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn recover_unsold_tokens() -> Weight {
        (260_434_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
