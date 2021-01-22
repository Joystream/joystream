//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl membership::WeightInfo for WeightInfo {
    fn buy_membership_without_referrer(i: u32, j: u32, k: u32, z: u32) -> Weight {
        (245_545_000 as Weight)
            .saturating_add((3_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(k as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(z as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn buy_membership_with_referrer(i: u32, j: u32, k: u32, z: u32) -> Weight {
        (439_284_000 as Weight)
            .saturating_add((2_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(k as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(z as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn update_profile(i: u32) -> Weight {
        (356_978_000 as Weight)
            .saturating_add((55_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_accounts_none() -> Weight {
        (9_314_000 as Weight)
    }
    fn update_accounts_root() -> Weight {
        (180_791_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_controller() -> Weight {
        (180_942_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_both() -> Weight {
        (181_642_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_referral_cut() -> Weight {
        (63_916_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn transfer_invites() -> Weight {
        (415_109_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn invite_member(i: u32, j: u32, k: u32, z: u32) -> Weight {
        (550_755_000 as Weight)
            .saturating_add((3_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(k as Weight))
            .saturating_add((1_000 as Weight).saturating_mul(z as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn set_membership_price() -> Weight {
        (67_277_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_profile_verification() -> Weight {
        (315_084_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_leader_invitation_quota() -> Weight {
        (291_926_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_balance() -> Weight {
        (67_445_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_count() -> Weight {
        (59_675_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn add_staking_account_candidate() -> Weight {
        (183_576_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn confirm_staking_account() -> Weight {
        (267_844_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_staking_account() -> Weight {
        (206_082_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
