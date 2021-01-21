//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
    fn execute_signal_proposal(i: u32) -> Weight {
        (16_042_000 as Weight).saturating_add((41_000 as Weight).saturating_mul(i as Weight))
    }
    fn create_proposal_signal(i: u32, t: u32, d: u32) -> Weight {
        (0 as Weight)
            .saturating_add((296_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((10_652_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((14_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_runtime_upgrade(i: u32, t: u32) -> Weight {
        (0 as Weight)
            .saturating_add((370_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((34_716_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_funding_request() -> Weight {
        (748_303_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_set_max_validator_count() -> Weight {
        (731_233_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_create_working_group_lead_opening(i: u32, t: u32) -> Weight {
        (0 as Weight)
            .saturating_add((485_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((23_755_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_fill_working_group_lead_opening() -> Weight {
        (999_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_update_working_group_budget(t: u32, d: u32) -> Weight {
        (420_054_000 as Weight)
            .saturating_add((5_853_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((76_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_decrease_working_group_lead_stake(d: u32) -> Weight {
        (778_605_000 as Weight)
            .saturating_add((12_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_slash_working_group_lead() -> Weight {
        (758_609_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_set_working_group_lead_reward(t: u32) -> Weight {
        (641_272_000 as Weight)
            .saturating_add((53_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_terminate_working_group_lead(t: u32) -> Weight {
        (628_976_000 as Weight)
            .saturating_add((1_434_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_amend_constitution(i: u32, t: u32) -> Weight {
        (301_477_000 as Weight)
            .saturating_add((328_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((5_947_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_cancel_working_group_lead_opening(d: u32) -> Weight {
        (717_016_000 as Weight)
            .saturating_add((4_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_membership_price(t: u32, d: u32) -> Weight {
        (648_039_000 as Weight)
            .saturating_add((350_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((3_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_council_budget_increment(t: u32, d: u32) -> Weight {
        (544_120_000 as Weight)
            .saturating_add((1_986_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((22_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_councilor_reward(d: u32) -> Weight {
        (679_828_000 as Weight)
            .saturating_add((8_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_initial_invitation_balance(d: u32) -> Weight {
        (647_942_000 as Weight)
            .saturating_add((7_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_initial_invitation_count(t: u32, d: u32) -> Weight {
        (622_013_000 as Weight)
            .saturating_add((2_003_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((7_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_set_membership_lead_invitation_quota() -> Weight {
        (688_083_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_set_referral_cut(t: u32) -> Weight {
        (638_572_000 as Weight)
            .saturating_add((353_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn update_working_group_budget_positive_forum() -> Weight {
        (101_370_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_forum() -> Weight {
        (101_227_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_storage() -> Weight {
        (101_047_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_storage() -> Weight {
        (101_188_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_content() -> Weight {
        (101_790_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_content() -> Weight {
        (101_742_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_membership() -> Weight {
        (100_238_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_membership() -> Weight {
        (100_460_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
