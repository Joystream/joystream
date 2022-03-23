//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl membership::WeightInfo for WeightInfo {
    fn buy_membership_without_referrer(i: u32, j: u32) -> Weight {
        (1_240_241_000 as Weight)
            .saturating_add((172_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((250_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn buy_membership_with_referrer(i: u32, j: u32) -> Weight {
        (1_211_185_000 as Weight)
            .saturating_add((187_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((267_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn update_profile(i: u32) -> Weight {
        (506_958_000 as Weight)
            .saturating_add((344_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_accounts_none() -> Weight {
        (14_899_000 as Weight)
    }
    fn update_accounts_root() -> Weight {
        (338_531_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_controller() -> Weight {
        (339_930_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_accounts_both() -> Weight {
        (341_573_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_referral_cut() -> Weight {
        (108_946_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn transfer_invites() -> Weight {
        (711_865_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn invite_member(i: u32, j: u32) -> Weight {
        (1_753_562_000 as Weight)
            .saturating_add((180_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((250_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn set_membership_price() -> Weight {
        (112_811_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_profile_verification() -> Weight {
        (545_137_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_leader_invitation_quota() -> Weight {
        (395_546_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_balance() -> Weight {
        (126_112_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_initial_invitation_count() -> Weight {
        (115_422_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn add_staking_account_candidate() -> Weight {
        (763_787_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn confirm_staking_account() -> Weight {
        (509_665_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_staking_account() -> Weight {
        (723_957_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn member_remark() -> Weight {
        (248_401_000 as Weight).saturating_add(DbWeight::get().reads(1 as Weight))
    }
}
