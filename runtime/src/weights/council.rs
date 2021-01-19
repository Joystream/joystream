//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl council::WeightInfo for WeightInfo {
    fn set_budget_increment() -> Weight {
        (83_923_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_councilor_reward() -> Weight {
        (82_332_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn funding_request(i: u32) -> Weight {
        (0 as Weight)
            .saturating_add((240_865_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn try_process_budget() -> Weight {
        (1_089_690_000 as Weight)
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn try_progress_stage_idle() -> Weight {
        (127_036_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_progress_stage_announcing_start_election(i: u32) -> Weight {
        (213_060_000 as Weight)
            .saturating_add((316_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_progress_stage_announcing_restart() -> Weight {
        (126_148_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn announce_candidacy() -> Weight {
        (539_912_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn release_candidacy_stake() -> Weight {
        (419_221_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn set_candidacy_note(i: u32) -> Weight {
        (353_199_000 as Weight)
            .saturating_add((177_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn withdraw_candidacy() -> Weight {
        (444_837_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn set_budget() -> Weight {
        (71_589_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn plan_budget_refill() -> Weight {
        (66_611_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
