//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl utility::WeightInfo for WeightInfo {
    fn execute_signal_proposal(i: u32) -> Weight {
        (81_623_000 as Weight).saturating_add((162_000 as Weight).saturating_mul(i as Weight))
    }
    fn update_working_group_budget_positive_forum() -> Weight {
        (158_627_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_forum() -> Weight {
        (158_189_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_storage() -> Weight {
        (158_593_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_storage() -> Weight {
        (158_974_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_content() -> Weight {
        (158_706_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_content() -> Weight {
        (158_540_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_positive_membership() -> Weight {
        (156_882_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_working_group_budget_negative_membership() -> Weight {
        (157_833_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn burn_account_tokens() -> Weight {
        (166_780_000 as Weight)
    }
}
