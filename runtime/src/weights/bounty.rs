//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
    // WARNING! Some components were not used: ["i"]
    fn create_bounty_by_council() -> Weight {
        (439_907_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    // WARNING! Some components were not used: ["i"]
    fn create_bounty_by_member() -> Weight {
        (694_714_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn cancel_bounty_by_council() -> Weight {
        (322_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn cancel_bounty_by_member() -> Weight {
        (423_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn veto_bounty() -> Weight {
        (312_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn fund_bounty_by_member() -> Weight {
        (857_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn fund_bounty_by_council() -> Weight {
        (574_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_funding_by_member() -> Weight {
        (955_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_funding_by_council() -> Weight {
        (726_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_creator_cherry_by_council() -> Weight {
        (675_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_creator_cherry_by_member() -> Weight {
        (878_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn announce_work_entry() -> Weight {
        (1_347_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn withdraw_work_entry() -> Weight {
        (989_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn submit_work(i: u32) -> Weight {
        (637_023_000 as Weight)
            .saturating_add((173_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn submit_oracle_judgment_by_council_all_winners(i: u32) -> Weight {
        (370_375_000 as Weight)
            .saturating_add((136_209_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_council_all_rejected(i: u32) -> Weight {
        (589_622_000 as Weight)
            .saturating_add((325_893_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_winners(i: u32) -> Weight {
        (440_793_000 as Weight)
            .saturating_add((136_443_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_rejected(i: u32) -> Weight {
        (437_346_000 as Weight)
            .saturating_add((335_207_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn withdraw_work_entrant_funds() -> Weight {
        (1_372_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
}
