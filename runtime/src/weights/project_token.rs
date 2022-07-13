//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl project_token::WeightInfo for WeightInfo {
    fn transfer(o: u32) -> Weight {
        (633_236_000 as Weight)
            .saturating_add((155_690_000 as Weight).saturating_mul(o as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(o as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(o as Weight)))
    }
    fn dust_account() -> Weight {
        (618_287_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn join_whitelist(h: u32) -> Weight {
        (678_327_000 as Weight)
            .saturating_add((14_421_000 as Weight).saturating_mul(h as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn purchase_tokens_on_sale() -> Weight {
        (1_196_549_000 as Weight)
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn recover_unsold_tokens() -> Weight {
        (267_894_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn participate_in_split() -> Weight {
        (635_026_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn exit_revenue_split() -> Weight {
        (318_727_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn burn() -> Weight {
        (463_798_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
