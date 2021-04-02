//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl membership::WeightInfo for WeightInfo {
    fn buy_membership_without_referrer(i: u32, j: u32) -> Weight {
        (580_636_000 as Weight)
            .saturating_add((95_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((131_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn buy_membership_with_referrer(i: u32, j: u32) -> Weight {
        (741_433_000 as Weight)
            .saturating_add((92_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((131_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn update_profile(i: u32) -> Weight {
        (327_665_000 as Weight)
            .saturating_add((173_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_accounts_none() -> Weight {
        (8_025_000 as Weight)
    }
    fn update_accounts_root() -> Weight {
        (172_444_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_controller() -> Weight {
        (172_544_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_both() -> Weight {
        (172_614_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_referral_cut() -> Weight {
        (65_363_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn transfer_invites() -> Weight {
        (364_596_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn invite_member(i: u32, j: u32) -> Weight {
        (800_719_000 as Weight)
            .saturating_add((97_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((131_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn set_membership_price() -> Weight {
        (66_976_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_profile_verification() -> Weight {
        (274_927_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_leader_invitation_quota() -> Weight {
        (187_743_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_balance() -> Weight {
        (65_533_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_count() -> Weight {
        (60_294_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn add_staking_account_candidate() -> Weight {
        (164_369_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn confirm_staking_account() -> Weight {
        (242_797_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_staking_account() -> Weight {
        (185_459_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
