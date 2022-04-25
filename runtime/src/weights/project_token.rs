//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl project_token::WeightInfo for WeightInfo {
    fn transfer(o: u32) -> Weight {
        (166_583_000 as Weight)
            .saturating_add((43_906_000 as Weight).saturating_mul(o as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(o as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(o as Weight)))
    }
    fn dust_account() -> Weight {
        (378_474_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn join_whitelist(h: u32) -> Weight {
        (332_692_000 as Weight)
            .saturating_add((16_205_000 as Weight).saturating_mul(h as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn purchase_tokens_on_sale_with_proof(h: u32) -> Weight {
        (742_125_000 as Weight)
            .saturating_add((16_269_000 as Weight).saturating_mul(h as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn purchase_tokens_on_sale_without_proof() -> Weight {
        (688_297_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn recover_unsold_tokens() -> Weight {
        (327_109_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
