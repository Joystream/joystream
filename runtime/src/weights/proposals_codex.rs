//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
    fn execute_signal_proposal(i: u32) -> Weight {
        (14_205_000 as Weight).saturating_add((36_000 as Weight).saturating_mul(i as Weight))
    }
    fn create_proposal_signal(i: u32, t: u32, d: u32) -> Weight {
        (381_500_000 as Weight)
            .saturating_add((280_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((4_369_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((56_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_runtime_upgrade(i: u32, t: u32, d: u32) -> Weight {
        (417_621_000 as Weight)
            .saturating_add((282_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((2_246_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((47_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_funding_request(i: u32) -> Weight {
        (1_073_701_000 as Weight)
            .saturating_add((20_213_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_max_validator_count(d: u32) -> Weight {
        (680_435_000 as Weight)
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_create_working_group_lead_opening(i: u32) -> Weight {
        (1_658_073_000 as Weight)
            .saturating_add((401_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_fill_working_group_lead_opening() -> Weight {
        (688_697_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_update_working_group_budget(d: u32) -> Weight {
        (677_232_000 as Weight)
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_decrease_working_group_lead_stake(t: u32, d: u32) -> Weight {
        (673_696_000 as Weight)
            .saturating_add((57_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_slash_working_group_lead(t: u32, d: u32) -> Weight {
        (665_717_000 as Weight)
            .saturating_add((416_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((2_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_working_group_lead_reward(d: u32) -> Weight {
        (681_995_000 as Weight)
            .saturating_add((10_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_terminate_working_group_lead() -> Weight {
        (672_205_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_amend_constitution(i: u32, t: u32, d: u32) -> Weight {
        (415_625_000 as Weight)
            .saturating_add((298_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((3_229_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((34_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_cancel_working_group_lead_opening(t: u32, d: u32) -> Weight {
        (650_522_000 as Weight)
            .saturating_add((406_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((5_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_set_membership_price() -> Weight {
        (688_555_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_set_council_budget_increment() -> Weight {
        (677_145_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_set_councilor_reward(t: u32) -> Weight {
        (691_635_000 as Weight)
            .saturating_add((538_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_set_initial_invitation_balance(t: u32, d: u32) -> Weight {
        (647_455_000 as Weight)
            .saturating_add((605_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((6_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_set_initial_invitation_count() -> Weight {
        (708_072_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_set_membership_lead_invitation_quota(t: u32) -> Weight {
        (729_756_000 as Weight)
            .saturating_add((462_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_set_referral_cut(t: u32) -> Weight {
        (669_708_000 as Weight)
            .saturating_add((263_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_create_blog_post(t: u32, d: u32, h: u32, b: u32) -> Weight {
        (0 as Weight)
            .saturating_add((26_565_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((473_000 as Weight).saturating_mul(d as Weight))
            .saturating_add((389_000 as Weight).saturating_mul(h as Weight))
            .saturating_add((392_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_edit_blog_post(t: u32, d: u32, h: u32, b: u32) -> Weight {
        (0 as Weight)
            .saturating_add((51_663_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((415_000 as Weight).saturating_mul(d as Weight))
            .saturating_add((381_000 as Weight).saturating_mul(h as Weight))
            .saturating_add((408_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    // WARNING! Some components were not used: ["d"]
    fn create_proposal_lock_blog_post(t: u32) -> Weight {
        (732_383_000 as Weight)
            .saturating_add((13_000 as Weight).saturating_mul(t as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn create_proposal_emergency_proposal_cancellation(d: u32) -> Weight {
        (1_209_486_000 as Weight)
            .saturating_add((222_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    // WARNING! Some components were not used: ["t", "d"]
    fn create_proposal_unlock_blog_post() -> Weight {
        (670_647_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(10 as Weight))
    }
    fn update_working_group_budget_positive_forum() -> Weight {
        (102_611_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_forum() -> Weight {
        (102_707_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_storage() -> Weight {
        (102_791_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_storage() -> Weight {
        (102_502_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_content() -> Weight {
        (103_375_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_content() -> Weight {
        (102_741_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_membership() -> Weight {
        (103_449_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_membership() -> Weight {
        (102_274_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
