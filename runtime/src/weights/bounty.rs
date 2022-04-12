//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
	fn create_bounty_by_council(i: u32, j: u32, ) -> Weight {
		(430_029_000 as Weight)
			.saturating_add((168_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((5_712_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn create_bounty_by_member(i: u32, j: u32, ) -> Weight {
		(755_563_000 as Weight)
			.saturating_add((172_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((2_079_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn terminate_bounty_w_oracle_reward_funding_expired() -> Weight {
		(475_301_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn terminate_bounty_wo_oracle_reward_funding_expired() -> Weight {
		(688_233_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn terminate_bounty_w_oracle_reward_wo_funds_funding() -> Weight {
		(505_328_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn terminate_bounty_wo_oracle_reward_wo_funds_funding() -> Weight {
		(775_967_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn terminate_bounty_w_oracle_reward_w_funds_funding() -> Weight {
		(325_586_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn terminate_bounty_wo_oracle_reward_w_funds_funding() -> Weight {
		(448_919_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn terminate_bounty_work_or_judging_period() -> Weight {
		(347_494_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn fund_bounty_by_member() -> Weight {
		(769_881_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn fund_bounty_by_council() -> Weight {
		(562_668_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funding_by_member() -> Weight {
		(749_330_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_funding_by_council() -> Weight {
		(547_507_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn announce_work_entry(i: u32, ) -> Weight {
		(721_383_000 as Weight)
			.saturating_add((9_010_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(5 as Weight))
	}
	fn submit_work(i: u32, ) -> Weight {
		(389_486_000 as Weight)
			.saturating_add((169_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn submit_oracle_judgment_by_council_all_winners(i: u32, ) -> Weight {
		(424_561_000 as Weight)
			.saturating_add((853_913_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_council_all_rejected(i: u32, j: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((10_153_028_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((18_959_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_winners(i: u32, ) -> Weight {
		(590_808_000 as Weight)
			.saturating_add((858_641_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_rejected(i: u32, j: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((10_129_977_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((18_961_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn switch_oracle_to_council_by_council_successful() -> Weight {
		(282_335_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_oracle_council() -> Weight {
		(361_309_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_council() -> Weight {
		(409_493_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_oracle_member() -> Weight {
		(518_430_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_council_by_oracle_member() -> Weight {
		(405_235_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn end_working_period() -> Weight {
		(402_370_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn unlock_work_entrant_stake() -> Weight {
		(626_543_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funding_state_bloat_bond_by_council() -> Weight {
		(475_197_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_funding_state_bloat_bond_by_member() -> Weight {
		(672_832_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_oracle_reward_by_oracle_council() -> Weight {
		(792_870_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_oracle_reward_by_oracle_member() -> Weight {
		(1_216_160_000 as Weight)
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
}
