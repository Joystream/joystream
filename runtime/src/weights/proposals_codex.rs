//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
    fn execute_signal_proposal(i: u32) -> Weight {
        (14_621_000 as Weight).saturating_add((44_000 as Weight).saturating_mul(i as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_signal(i: u32, t: u32) -> Weight {
        (670_987_000 as Weight)
            .saturating_add((273_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((565_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_runtime_upgrade(i: u32) -> Weight {
        (707_989_000 as Weight)
            .saturating_add((280_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_funding_request(t: u32, d: u32) -> Weight {
        (585_920_000 as Weight)
            .saturating_add((1_192_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((14_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_set_max_validator_count() -> Weight {
        (676_799_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_create_working_group_lead_opening(i: u32, d: u32) -> Weight {
        (634_447_000 as Weight)
            .saturating_add((401_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((30_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_fill_working_group_lead_opening(t: u32) -> Weight {
        (664_380_000 as Weight)
            .saturating_add((57_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_update_working_group_budget(d: u32) -> Weight {
        (655_799_000 as Weight)
            .saturating_add((2_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_decrease_working_group_lead_stake(t: u32, d: u32) -> Weight {
        (626_011_000 as Weight)
            .saturating_add((757_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((6_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_slash_working_group_lead() -> Weight {
        (685_880_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_set_working_group_lead_reward(t: u32) -> Weight {
        (644_706_000 as Weight)
            .saturating_add((98_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_terminate_working_group_lead(t: u32) -> Weight {
        (666_916_000 as Weight)
            .saturating_add((131_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_amend_constitution(i: u32, t: u32) -> Weight {
        (723_614_000 as Weight)
            .saturating_add((292_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((478_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_cancel_working_group_lead_opening() -> Weight {
        (651_882_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_membership_price(d: u32) -> Weight {
        (646_017_000 as Weight)
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_council_budget_increment(t: u32, d: u32) -> Weight {
        (637_702_000 as Weight)
            .saturating_add((283_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((2_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_councilor_reward(d: u32) -> Weight {
        (650_165_000 as Weight)
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_set_initial_invitation_balance(t: u32) -> Weight {
        (647_828_000 as Weight)
            .saturating_add((29_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_set_initial_invitation_count() -> Weight {
        (652_119_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_set_membership_lead_invitation_quota() -> Weight {
        (1_534_657_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_referral_cut(t: u32, d: u32) -> Weight {
        (538_230_000 as Weight)
            .saturating_add((2_331_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((26_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn update_working_group_budget_positive_forum() -> Weight {
        (186_049_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_forum() -> Weight {
        (186_498_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_storage() -> Weight {
        (185_745_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_storage() -> Weight {
        (185_138_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_content() -> Weight {
        (186_835_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_content() -> Weight {
        (186_768_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_membership() -> Weight {
        (186_077_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_membership() -> Weight {
        (186_014_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn funding_request() -> Weight {
        (296_081_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
