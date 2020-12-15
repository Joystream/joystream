//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
    fn execute_signal_proposal(i: u32) -> Weight {
        (16_059_000 as Weight).saturating_add((41_000 as Weight).saturating_mul(i as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_signal(i: u32) -> Weight {
        (663_482_000 as Weight)
            .saturating_add((246_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_runtime_upgrade(i: u32, t: u32, d: u32) -> Weight {
        (0 as Weight)
            .saturating_add((298_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((13_792_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((140_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_funding_request() -> Weight {
        (1_011_708_000 as Weight)
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_max_validator_count(t: u32, d: u32) -> Weight {
        (737_501_000 as Weight)
            .saturating_add((3_119_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((20_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_create_working_group_lead_opening(i: u32, t: u32, d: u32) -> Weight {
        (393_931_000 as Weight)
            .saturating_add((383_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((6_783_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((164_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_fill_working_group_lead_opening(t: u32, d: u32) -> Weight {
        (566_718_000 as Weight)
            .saturating_add((3_073_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((20_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_update_working_group_budget(d: u32) -> Weight {
        (697_884_000 as Weight)
            .saturating_add((4_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_decrease_working_group_lead_stake() -> Weight {
        (660_344_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_slash_working_group_lead(d: u32) -> Weight {
        (650_009_000 as Weight)
            .saturating_add((4_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_working_group_lead_reward(d: u32) -> Weight {
        (641_391_000 as Weight)
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_terminate_working_group_lead(t: u32, d: u32) -> Weight {
        (640_488_000 as Weight)
            .saturating_add((55_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_amend_constitution(i: u32, t: u32, d: u32) -> Weight {
        (527_420_000 as Weight)
            .saturating_add((278_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((1_785_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((21_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_cancel_working_group_lead_opening(t: u32) -> Weight {
        (644_736_000 as Weight)
            .saturating_add((50_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_membership_price(t: u32, d: u32) -> Weight {
        (638_989_000 as Weight)
            .saturating_add((53_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_council_budget_increment(d: u32) -> Weight {
        (635_709_000 as Weight)
            .saturating_add((16_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_set_councilor_reward(t: u32) -> Weight {
        (648_346_000 as Weight)
            .saturating_add((110_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_initial_invitation_balance(t: u32, d: u32) -> Weight {
        (632_164_000 as Weight)
            .saturating_add((271_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
}
