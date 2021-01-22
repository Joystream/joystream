//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl membership::WeightInfo for WeightInfo {
    fn buy_membership_without_referrer(i: u32) -> Weight {
        (353_184_000 as Weight)
            .saturating_add((2_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn buy_membership_with_referrer(i: u32) -> Weight {
        (554_008_000 as Weight)
            .saturating_add((2_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn update_profile(i: u32) -> Weight {
        (446_195_000 as Weight)
            .saturating_add((72_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_accounts_none() -> Weight {
        (11_101_000 as Weight)
    }
    fn update_accounts_root() -> Weight {
        (224_926_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_controller() -> Weight {
        (224_476_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_both() -> Weight {
        (224_616_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_referral_cut() -> Weight {
        (78_995_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn transfer_invites() -> Weight {
        (507_472_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn invite_member(i: u32) -> Weight {
        (657_622_000 as Weight)
            .saturating_add((2_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn set_membership_price() -> Weight {
        (78_998_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_profile_verification() -> Weight {
        (382_380_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_leader_invitation_quota() -> Weight {
        (352_240_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_balance() -> Weight {
        (76_451_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_count() -> Weight {
        (70_621_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn add_staking_account_candidate() -> Weight {
        (214_287_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn confirm_staking_account() -> Weight {
        (324_026_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_staking_account() -> Weight {
        (247_835_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
