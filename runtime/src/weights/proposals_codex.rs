//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_codex::WeightInfo for WeightInfo {
    fn create_proposal_signal(i: u32, t: u32, d: u32) -> Weight {
        (0 as Weight)
            .saturating_add((376_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((4_900_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((365_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_runtime_upgrade(i: u32, t: u32, d: u32) -> Weight {
        (0 as Weight)
            .saturating_add((378_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((2_563_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((390_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_funding_request(i: u32, d: u32) -> Weight {
        (859_709_000 as Weight)
            .saturating_add((19_988_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((160_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_set_max_validator_count(t: u32, d: u32) -> Weight {
        (737_041_000 as Weight)
            .saturating_add((436_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((232_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_veto_proposal(t: u32, d: u32) -> Weight {
        (714_146_000 as Weight)
            .saturating_add((667_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((235_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_create_working_group_lead_opening(i: u32, t: u32, d: u32) -> Weight {
        (318_298_000 as Weight)
            .saturating_add((439_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((1_090_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((346_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_fill_working_group_lead_opening(t: u32, d: u32) -> Weight {
        (735_636_000 as Weight)
            .saturating_add((518_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((235_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_update_working_group_budget(t: u32, d: u32) -> Weight {
        (751_256_000 as Weight)
            .saturating_add((235_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((234_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_decrease_working_group_lead_stake(t: u32, d: u32) -> Weight {
        (737_989_000 as Weight)
            .saturating_add((349_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((236_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_slash_working_group_lead(d: u32) -> Weight {
        (829_696_000 as Weight)
            .saturating_add((230_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_set_working_group_lead_reward(t: u32, d: u32) -> Weight {
        (692_873_000 as Weight)
            .saturating_add((1_313_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((237_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_terminate_working_group_lead(t: u32, d: u32) -> Weight {
        (319_918_000 as Weight)
            .saturating_add((9_527_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((324_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_amend_constitution(i: u32, d: u32) -> Weight {
        (914_780_000 as Weight)
            .saturating_add((362_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((405_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_cancel_working_group_lead_opening(d: u32) -> Weight {
        (837_566_000 as Weight)
            .saturating_add((217_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_set_membership_price(t: u32, d: u32) -> Weight {
        (700_754_000 as Weight)
            .saturating_add((788_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((236_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_set_council_budget_increment(t: u32, d: u32) -> Weight {
        (729_517_000 as Weight)
            .saturating_add((446_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((231_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_set_councilor_reward(t: u32, d: u32) -> Weight {
        (728_569_000 as Weight)
            .saturating_add((445_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((231_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_set_initial_invitation_balance(t: u32, d: u32) -> Weight {
        (720_097_000 as Weight)
            .saturating_add((603_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((233_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_set_initial_invitation_count(t: u32, d: u32) -> Weight {
        (718_767_000 as Weight)
            .saturating_add((591_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((233_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    // WARNING! Some components were not used: ["t"]
    fn create_proposal_set_membership_lead_invitation_quota(d: u32) -> Weight {
        (794_786_000 as Weight)
            .saturating_add((230_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_set_referral_cut(t: u32, d: u32) -> Weight {
        (727_615_000 as Weight)
            .saturating_add((451_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((235_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_create_blog_post(t: u32, d: u32, h: u32, b: u32) -> Weight {
        (0 as Weight)
            .saturating_add((30_282_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((746_000 as Weight).saturating_mul(d as Weight))
            .saturating_add((323_000 as Weight).saturating_mul(h as Weight))
            .saturating_add((352_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_edit_blog_post(t: u32, d: u32, h: u32, b: u32) -> Weight {
        (528_348_000 as Weight)
            .saturating_add((13_015_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((737_000 as Weight).saturating_mul(d as Weight))
            .saturating_add((318_000 as Weight).saturating_mul(h as Weight))
            .saturating_add((356_000 as Weight).saturating_mul(b as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_lock_blog_post(t: u32, d: u32) -> Weight {
        (633_768_000 as Weight)
            .saturating_add((2_369_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((241_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
    fn create_proposal_unlock_blog_post(t: u32, d: u32) -> Weight {
        (742_217_000 as Weight)
            .saturating_add((523_000 as Weight).saturating_mul(t as Weight))
            .saturating_add((239_000 as Weight).saturating_mul(d as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(9 as Weight))
    }
}
