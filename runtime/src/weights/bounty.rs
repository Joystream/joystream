//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
    fn create_bounty_by_council(i: u32, j: u32) -> Weight {
        (32_065_000 as Weight)
            .saturating_add((175_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((10_541_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn create_bounty_by_member(i: u32, j: u32) -> Weight {
        (567_276_000 as Weight)
            .saturating_add((162_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((9_211_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn cancel_bounty_by_council() -> Weight {
        (617_662_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn cancel_bounty_by_member() -> Weight {
        (1_025_742_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn fund_bounty_by_member() -> Weight {
        (767_288_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn fund_bounty_by_council() -> Weight {
        (500_007_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_funding_by_member() -> Weight {
        (1_043_571_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn withdraw_funding_by_council() -> Weight {
        (788_399_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn announce_work_entry(i: u32) -> Weight {
        (698_014_000 as Weight)
            .saturating_add((7_640_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn submit_work(i: u32) -> Weight {
        (445_065_000 as Weight)
            .saturating_add((155_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn submit_oracle_judgment_by_council_all_winners(i: u32) -> Weight {
        (469_919_000 as Weight)
            .saturating_add((785_317_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_council_all_rejected(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((9_575_606_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((17_927_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_winners(i: u32) -> Weight {
        (783_702_000 as Weight)
            .saturating_add((777_307_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_rejected(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((9_579_933_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((17_928_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn switch_oracle_to_council_by_council_approval_successful() -> Weight {
        (273_751_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_oracle_council() -> Weight {
        (346_780_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_council_not_oracle() -> Weight {
        (349_896_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_oracle_member() -> Weight {
        (428_241_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_council_by_oracle_member() -> Weight {
        (351_206_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn end_working_period() -> Weight {
        (352_997_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn terminate_bounty() -> Weight {
        (428_033_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn unlock_work_entrant_stake() -> Weight {
        (688_738_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_state_bloat_bond_amount_by_council() -> Weight {
        (632_526_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_state_bloat_bond_amount_by_member() -> Weight {
        (873_410_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
}
