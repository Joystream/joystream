//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub trait WeightInfo {
    fn set_budget_increment() -> Weight;
    fn set_councilor_reward() -> Weight;
    fn funding_request(i: u32) -> Weight;
    fn try_process_budget() -> Weight;
    fn try_progress_stage_idle() -> Weight;
    fn try_progress_stage_announcing_start_election(i: u32) -> Weight;
    fn try_progress_stage_announcing_restart() -> Weight;
    fn announce_candidacy() -> Weight;
    fn release_candidacy_stake() -> Weight;
    fn set_candidacy_note(i: u32) -> Weight;
    fn withdraw_candidacy() -> Weight;
    fn set_budget() -> Weight;
    fn plan_budget_refill() -> Weight;
    fn fund_council_budget() -> Weight;
    fn councilor_remark() -> Weight;
    fn candidate_remark() -> Weight;
}

pub struct SubstrateWeight;
impl WeightInfo for SubstrateWeight {
    fn set_budget_increment() -> Weight {
        (90_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_councilor_reward() -> Weight {
        (89_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn funding_request(i: u32) -> Weight {
        (0 as Weight)
            .saturating_add((263_861_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn try_process_budget() -> Weight {
        (1_294_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn try_progress_stage_idle() -> Weight {
        (151_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_progress_stage_announcing_start_election(i: u32) -> Weight {
        (252_146_000 as Weight)
            .saturating_add((56_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn try_progress_stage_announcing_restart() -> Weight {
        (154_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn announce_candidacy() -> Weight {
        (663_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn release_candidacy_stake() -> Weight {
        (459_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn set_candidacy_note(i: u32) -> Weight {
        (385_991_000 as Weight)
            .saturating_add((170_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn withdraw_candidacy() -> Weight {
        (511_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn set_budget() -> Weight {
        (91_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn plan_budget_refill() -> Weight {
        (82_000_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn fund_council_budget() -> Weight {
        (324_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn councilor_remark() -> Weight {
        (406_707_000 as Weight).saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn candidate_remark() -> Weight {
        (406_707_000 as Weight).saturating_add(DbWeight::get().reads(2 as Weight))
    }
}

impl WeightInfo for () {
    fn try_process_budget() -> Weight {
        0
    }
    fn try_progress_stage_idle() -> Weight {
        0
    }
    fn try_progress_stage_announcing_start_election(_: u32) -> Weight {
        0
    }
    fn try_progress_stage_announcing_restart() -> Weight {
        0
    }
    fn announce_candidacy() -> Weight {
        0
    }
    fn release_candidacy_stake() -> Weight {
        0
    }
    fn set_candidacy_note(_: u32) -> Weight {
        0
    }
    fn withdraw_candidacy() -> Weight {
        0
    }
    fn set_budget() -> Weight {
        0
    }
    fn plan_budget_refill() -> Weight {
        0
    }
    fn set_budget_increment() -> Weight {
        0
    }
    fn set_councilor_reward() -> Weight {
        0
    }
    fn funding_request(_: u32) -> Weight {
        0
    }
    fn fund_council_budget() -> Weight {
        0
    }
    fn councilor_remark() -> Weight {
        0
    }
    fn candidate_remark() -> Weight {
        0
    }
}
