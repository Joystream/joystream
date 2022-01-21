//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl council::WeightInfo for WeightInfo {
    fn set_budget_increment() -> Weight {
        (141_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_councilor_reward() -> Weight {
        (100_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn funding_request(i: u32) -> Weight {
        (65_170_000 as Weight)
            .saturating_add((271_139_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn try_process_budget() -> Weight {
        (1_351_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn try_progress_stage_idle() -> Weight {
        (166_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_progress_stage_announcing_start_election(i: u32) -> Weight {
        (260_117_000 as Weight)
            .saturating_add((114_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_progress_stage_announcing_restart() -> Weight {
        (323_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn announce_candidacy() -> Weight {
        (672_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn release_candidacy_stake() -> Weight {
        (481_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn set_candidacy_note(i: u32) -> Weight {
        (429_167_000 as Weight)
            .saturating_add((174_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn withdraw_candidacy() -> Weight {
        (507_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn set_budget() -> Weight {
        (87_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn plan_budget_refill() -> Weight {
        (120_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn fund_council_budget() -> Weight {
        (388_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
}
