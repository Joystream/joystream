//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl membership::WeightInfo for WeightInfo {
    fn buy_membership_without_referrer(i: u32, j: u32) -> Weight {
        (963_632_000 as Weight)
            .saturating_add((150_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((219_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn buy_membership_with_referrer(i: u32, j: u32) -> Weight {
        (1_142_161_000 as Weight)
            .saturating_add((154_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((220_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn update_profile(i: u32) -> Weight {
        (486_464_000 as Weight)
            .saturating_add((281_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_accounts_none() -> Weight {
        (11_799_000 as Weight)
    }
    fn update_accounts_root() -> Weight {
        (275_444_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_controller() -> Weight {
        (275_106_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_both() -> Weight {
        (278_038_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_referral_cut() -> Weight {
        (87_788_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn transfer_invites() -> Weight {
        (576_170_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn invite_member(i: u32, j: u32) -> Weight {
        (1_355_852_000 as Weight)
            .saturating_add((149_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((220_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn set_membership_price() -> Weight {
        (91_834_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_profile_verification() -> Weight {
        (440_791_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_leader_invitation_quota() -> Weight {
        (304_410_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_balance() -> Weight {
        (96_105_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_count() -> Weight {
        (87_197_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn add_staking_account_candidate() -> Weight {
        (584_409_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn confirm_staking_account() -> Weight {
        (387_541_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_staking_account() -> Weight {
        (552_866_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn member_remark() -> u64 {
        todo!()
    }
}
