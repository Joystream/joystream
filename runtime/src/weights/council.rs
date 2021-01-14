//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl council::WeightInfo for WeightInfo {
    fn set_budget_increment() -> Weight {
        (81_940_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_councilor_reward() -> Weight {
        (78_574_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn funding_request() -> Weight {
        (271_177_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_process_budget() -> Weight {
        (1_088_776_000 as Weight)
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn try_progress_stage_idle() -> Weight {
        (125_452_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_progress_stage_announcing_start_election(i: u32) -> Weight {
        (218_383_000 as Weight)
            .saturating_add((267_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_progress_stage_announcing_restart() -> Weight {
        (122_291_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn announce_candidacy() -> Weight {
        (568_834_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn release_candidacy_stake() -> Weight {
        (453_519_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn set_candidacy_note(i: u32) -> Weight {
        (344_492_000 as Weight)
            .saturating_add((229_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn withdraw_candidacy() -> Weight {
        (450_936_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn set_budget() -> Weight {
        (72_551_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn plan_budget_refill() -> Weight {
        (66_748_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
