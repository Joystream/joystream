//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl council::WeightInfo for WeightInfo {
	fn set_budget_increment() -> Weight {
		(119_250_000 as Weight)
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn set_councilor_reward() -> Weight {
		(117_702_000 as Weight)
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn funding_request(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((370_110_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn try_process_budget() -> Weight {
		(1_717_612_000 as Weight)
			.saturating_add(DbWeight::get().reads(9 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn try_progress_stage_idle() -> Weight {
		(189_623_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn try_progress_stage_announcing_start_election(i: u32, ) -> Weight {
		(327_260_000 as Weight)
			.saturating_add((800_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn try_progress_stage_announcing_restart() -> Weight {
		(191_622_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn announce_candidacy() -> Weight {
		(896_118_000 as Weight)
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn release_candidacy_stake() -> Weight {
		(589_779_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn set_candidacy_note(i: u32, ) -> Weight {
		(517_359_000 as Weight)
			.saturating_add((254_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn withdraw_candidacy() -> Weight {
		(679_703_000 as Weight)
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn set_budget() -> Weight {
		(111_817_000 as Weight)
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn plan_budget_refill() -> Weight {
		(101_904_000 as Weight)
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn candidate_remark() -> Weight {
		(345_043_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
	}
	fn councilor_remark() -> Weight {
		(406_707_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
	}
}
