//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
    fn create_bounty_by_council(i: u32, j: u32) -> Weight {
        (680_111_000 as Weight)
            .saturating_add((163_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((1_985_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn create_bounty_by_member(i: u32, j: u32) -> Weight {
        (729_639_000 as Weight)
            .saturating_add((163_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((5_017_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn terminate_bounty_w_oracle_reward_funding_expired() -> Weight {
        (467_544_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn terminate_bounty_wo_oracle_reward_funding_expired() -> Weight {
        (836_986_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn terminate_bounty_w_oracle_reward_wo_funds_funding() -> Weight {
        (498_526_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn terminate_bounty_wo_oracle_reward_wo_funds_funding() -> Weight {
        (724_272_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn terminate_bounty_w_oracle_reward_w_funds_funding() -> Weight {
        (320_284_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn terminate_bounty_wo_oracle_reward_w_funds_funding() -> Weight {
        (436_853_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn terminate_bounty_work_or_judging_period() -> Weight {
        (318_365_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn fund_bounty_by_member() -> Weight {
        (853_211_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn fund_bounty_by_council() -> Weight {
        (526_279_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_funding_by_member() -> Weight {
        (732_228_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_funding_by_council() -> Weight {
        (441_098_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn announce_work_entry(i: u32, j: u32) -> Weight {
        (738_561_000 as Weight)
            .saturating_add((165_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((8_320_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn submit_work(i: u32) -> Weight {
        (364_135_000 as Weight)
            .saturating_add((169_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn submit_oracle_judgment_by_council_all_winners(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((899_982_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((203_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_council_all_rejected(i: u32, j: u32, k: u32) -> Weight {
        (0 as Weight)
            .saturating_add((9_911_157_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((317_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((18_560_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_winners(i: u32, j: u32) -> Weight {
        (288_887_000 as Weight)
            .saturating_add((888_561_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((169_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_rejected(i: u32, j: u32, k: u32) -> Weight {
        (0 as Weight)
            .saturating_add((9_905_208_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((414_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((18_333_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn switch_oracle_to_council_by_council_successful() -> Weight {
        (278_036_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_oracle_council() -> Weight {
        (388_288_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_council() -> Weight {
        (402_394_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_oracle_member() -> Weight {
        (470_504_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_council_by_oracle_member() -> Weight {
        (399_682_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn end_working_period() -> Weight {
        (416_302_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn withdraw_entrant_stake() -> Weight {
        (611_984_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_funding_state_bloat_bond_by_council() -> Weight {
        (397_036_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_funding_state_bloat_bond_by_member() -> Weight {
        (627_610_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_oracle_reward_by_oracle_council() -> Weight {
        (808_567_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_oracle_reward_by_oracle_member() -> Weight {
        (1_132_369_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn entrant_remark(i: u32) -> Weight {
        (293_109_000 as Weight)
            .saturating_add((164_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn contributor_remark(i: u32) -> Weight {
        (147_875_000 as Weight)
            .saturating_add((170_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn oracle_remark(i: u32) -> Weight {
        (246_149_000 as Weight)
            .saturating_add((164_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
    }
    fn creator_remark(i: u32) -> Weight {
        (151_457_000 as Weight)
            .saturating_add((169_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
    }
}
