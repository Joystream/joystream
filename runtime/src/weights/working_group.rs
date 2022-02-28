//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl working_group::WeightInfo for WeightInfo {
	fn on_initialize_leaving(i: u32, ) -> Weight {
		(9_011_876_000 as Weight)
			.saturating_add((1_019_158_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_rewarding_with_missing_reward(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((1_049_486_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_rewarding_with_missing_reward_cant_pay(i: u32, ) -> Weight {
		(4_634_959_000 as Weight)
			.saturating_add((516_394_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_rewarding_without_missing_reward(i: u32, ) -> Weight {
		(973_631_000 as Weight)
			.saturating_add((506_288_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn apply_on_opening(i: u32, ) -> Weight {
		(1_030_006_000 as Weight)
			.saturating_add((255_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn fill_opening_lead() -> Weight {
		(775_213_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(6 as Weight))
	}
	fn fill_opening_worker(i: u32, ) -> Weight {
		(651_141_000 as Weight)
			.saturating_add((497_245_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(5 as Weight))
			.saturating_add(DbWeight::get().writes((2 as Weight).saturating_mul(i as Weight)))
	}
	fn update_role_account() -> Weight {
		(561_638_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn cancel_opening() -> Weight {
		(974_307_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_application() -> Weight {
		(529_373_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn slash_stake(i: u32, ) -> Weight {
		(1_127_901_000 as Weight)
			.saturating_add((253_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn terminate_role_worker(i: u32, ) -> Weight {
		(1_950_392_000 as Weight)
			.saturating_add((504_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(5 as Weight))
	}
	fn terminate_role_lead(i: u32, ) -> Weight {
		(1_898_566_000 as Weight)
			.saturating_add((502_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(6 as Weight))
	}
	fn increase_stake() -> Weight {
		(804_388_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn decrease_stake() -> Weight {
		(948_984_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn spend_from_budget() -> Weight {
		(428_955_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn update_reward_amount() -> Weight {
		(608_563_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn set_status_text(i: u32, ) -> Weight {
		(353_651_000 as Weight)
			.saturating_add((258_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn update_reward_account() -> Weight {
		(471_797_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn set_budget() -> Weight {
		(117_641_000 as Weight)
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn add_opening(i: u32, ) -> Weight {
		(1_362_228_000 as Weight)
			.saturating_add((248_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn leave_role(i: u32, ) -> Weight {
		(473_226_000 as Weight)
			.saturating_add((221_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn lead_remark() -> Weight {
		(279_387_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
	}
	fn worker_remark() -> Weight {
		(302_419_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
	}
}
