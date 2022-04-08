//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
    fn create_bounty_by_council(i: u32, j: u32) -> Weight {
        (401_593_000 as Weight)
            .saturating_add((163_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((5_820_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn create_bounty_by_member(i: u32, j: u32) -> Weight {
        (854_693_000 as Weight)
            .saturating_add((162_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((2_548_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn terminate_bounty_w_oracle_reward_funding_expired() -> Weight {
        (480_720_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn terminate_bounty_wo_oracle_reward_funding_expired() -> Weight {
        (693_226_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn terminate_bounty_w_oracle_reward_wo_funds_funding() -> Weight {
        (464_167_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn terminate_bounty_wo_oracle_reward_wo_funds_funding() -> Weight {
        (645_971_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn terminate_bounty_w_oracle_reward_w_funds_funding() -> Weight {
        (284_179_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn terminate_bounty_wo_oracle_reward_w_funds_funding() -> Weight {
        (556_467_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn terminate_bounty_work_or_judging_period() -> Weight {
        (300_371_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn fund_bounty_by_member() -> Weight {
        (788_586_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn fund_bounty_by_council() -> Weight {
        (523_824_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_funding_by_member() -> Weight {
        (666_597_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_funding_by_council() -> Weight {
        (385_532_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn announce_work_entry(i: u32) -> Weight {
        (714_350_000 as Weight)
            .saturating_add((7_507_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn submit_work(i: u32) -> Weight {
        (349_563_000 as Weight)
            .saturating_add((164_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn submit_oracle_judgment_by_council_all_winners(i: u32) -> Weight {
        (374_186_000 as Weight)
            .saturating_add((835_333_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_council_all_rejected(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((9_847_237_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((18_406_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_winners(i: u32) -> Weight {
        (373_077_000 as Weight)
            .saturating_add((833_044_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_rejected(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((9_909_981_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((18_546_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn switch_oracle_to_council_by_council_successful() -> Weight {
        (314_835_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_oracle_council() -> Weight {
        (350_531_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_council() -> Weight {
        (417_973_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_oracle_member() -> Weight {
        (467_891_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_council_by_oracle_member() -> Weight {
        (386_071_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn end_working_period() -> Weight {
        (443_936_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn unlock_work_entrant_stake() -> Weight {
        (636_589_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_funder_state_bloat_bond_amount_by_council() -> Weight {
        (398_398_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_funder_state_bloat_bond_amount_by_member() -> Weight {
        (667_043_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_oracle_reward_by_oracle_council() -> Weight {
        (834_276_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_oracle_reward_by_oracle_member() -> Weight {
        (1_040_335_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
}
