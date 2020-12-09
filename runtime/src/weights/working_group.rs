//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl working_group::WeightInfo for WeightInfo {
    fn on_initialize_leaving(i: u32) -> Weight {
        (0 as Weight)
            .saturating_add((744_041_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rewarding_with_missing_reward(i: u32) -> Weight {
        (2_692_227_000 as Weight)
            .saturating_add((490_219_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rewarding_with_missing_reward_cant_pay(i: u32) -> Weight {
        (106_702_000 as Weight)
            .saturating_add((382_691_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rewarding_without_missing_reward(i: u32) -> Weight {
        (946_654_000 as Weight)
            .saturating_add((326_825_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn apply_on_opening(i: u32) -> Weight {
        (583_905_000 as Weight)
            .saturating_add((2_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn fill_opening_lead() -> Weight {
        (517_943_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn fill_opening_worker(i: u32) -> Weight {
        (0 as Weight)
            .saturating_add((337_560_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((2 as Weight).saturating_mul(i as Weight)))
    }
    fn update_role_account() -> Weight {
        (405_699_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn cancel_opening() -> Weight {
        (284_090_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn withdraw_application() -> Weight {
        (412_772_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn slash_stake(i: u32) -> Weight {
        (827_597_000 as Weight)
            .saturating_add((4_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn terminate_role_worker(i: u32) -> Weight {
        (1_268_966_000 as Weight)
            .saturating_add((14_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn terminate_role_lead(i: u32) -> Weight {
        (1_266_771_000 as Weight)
            .saturating_add((5_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(6 as Weight))
    }
    fn increase_stake() -> Weight {
        (783_675_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn decrease_stake() -> Weight {
        (895_623_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn spend_from_budget() -> Weight {
        (307_455_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_reward_amount() -> Weight {
        (420_916_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_status_text(i: u32) -> Weight {
        (238_830_000 as Weight)
            .saturating_add((68_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_reward_account() -> Weight {
        (313_123_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_budget() -> Weight {
        (81_417_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn add_opening(i: u32) -> Weight {
        (290_743_000 as Weight)
            .saturating_add((2_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn leave_role_immediatly() -> Weight {
        (544_861_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn leave_role_later() -> Weight {
        (341_012_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
