//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl working_group::WeightInfo for WeightInfo {
    fn on_initialize_leaving(i: u32) -> Weight {
        (547_711_000 as Weight)
            .saturating_add((766_740_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rewarding_with_missing_reward(i: u32) -> Weight {
        (40_861_000 as Weight)
            .saturating_add((706_808_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rewarding_with_missing_reward_cant_pay(i: u32) -> Weight {
        (24_293_000 as Weight)
            .saturating_add((404_092_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rewarding_without_missing_reward(i: u32) -> Weight {
        (379_807_000 as Weight)
            .saturating_add((381_108_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn apply_on_opening(i: u32) -> Weight {
        (756_904_000 as Weight)
            .saturating_add((168_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn fill_opening_lead() -> Weight {
        (629_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn fill_opening_worker(i: u32) -> Weight {
        (619_349_000 as Weight)
            .saturating_add((357_008_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(5 as Weight))
            .saturating_add(DbWeight::get().writes((2 as Weight).saturating_mul(i as Weight)))
    }
    fn update_role_account() -> Weight {
        (405_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn cancel_opening() -> Weight {
        (692_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn withdraw_application() -> Weight {
        (381_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn slash_stake(i: u32) -> Weight {
        (775_214_000 as Weight)
            .saturating_add((177_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn terminate_role_worker(i: u32) -> Weight {
        (1_407_476_000 as Weight)
            .saturating_add((341_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn terminate_role_lead(i: u32) -> Weight {
        (1_362_833_000 as Weight)
            .saturating_add((338_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn increase_stake() -> Weight {
        (570_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn decrease_stake() -> Weight {
        (751_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn spend_from_budget() -> Weight {
        (315_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn fund_working_group_budget() -> Weight {
        (317_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_reward_amount() -> Weight {
        (435_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_status_text(i: u32) -> Weight {
        (207_619_000 as Weight)
            .saturating_add((182_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_reward_account() -> Weight {
        (339_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_budget() -> Weight {
        (85_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn add_opening(i: u32) -> Weight {
        (890_286_000 as Weight)
            .saturating_add((186_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn leave_role(i: u32) -> Weight {
        (332_048_000 as Weight)
            .saturating_add((153_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
