//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
	fn create_bounty_by_council(i: u32, j: u32, ) -> Weight {
		(462_223_000 as Weight)
			.saturating_add((161_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((2_856_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn create_bounty_by_member(i: u32, j: u32, ) -> Weight {
		(746_959_000 as Weight)
			.saturating_add((159_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((2_920_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn terminate_bounty_w_oracle_reward_funding_expired() -> Weight {
		(421_920_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn terminate_bounty_wo_oracle_reward_funding_expired() -> Weight {
		(649_718_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn terminate_bounty_w_oracle_reward_wo_funds_funding() -> Weight {
		(422_044_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn terminate_bounty_wo_oracle_reward_wo_funds_funding() -> Weight {
		(650_298_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn terminate_bounty_w_oracle_reward_w_funds_funding() -> Weight {
		(266_963_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn terminate_bounty_wo_oracle_reward_w_funds_funding() -> Weight {
		(267_044_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn terminate_bounty_work_or_judging_period() -> Weight {
		(265_647_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn fund_bounty_by_member() -> Weight {
		(756_955_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn fund_bounty_by_council() -> Weight {
		(494_511_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funding_by_member() -> Weight {
		(614_602_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_funding_by_council() -> Weight {
		(370_413_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn announce_work_entry(i: u32, ) -> Weight {
		(698_967_000 as Weight)
			.saturating_add((6_967_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(5 as Weight))
	}
	fn submit_work(i: u32, ) -> Weight {
		(369_620_000 as Weight)
			.saturating_add((158_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn submit_oracle_judgment_by_council_all_winners(i: u32, ) -> Weight {
		(1_015_899_000 as Weight)
			.saturating_add((792_199_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_council_all_rejected(i: u32, j: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((9_592_643_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((17_953_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_winners(i: u32, ) -> Weight {
		(501_982_000 as Weight)
			.saturating_add((789_715_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_rejected(i: u32, j: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((9_595_179_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((17_955_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn switch_oracle_to_council_by_council_approval_successful() -> Weight {
		(266_269_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_oracle_council() -> Weight {
		(346_459_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_council_not_oracle() -> Weight {
		(350_286_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_oracle_member() -> Weight {
		(433_549_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_council_by_oracle_member() -> Weight {
		(350_361_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn end_working_period() -> Weight {
		(349_625_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn unlock_work_entrant_stake() -> Weight {
		(560_546_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funder_state_bloat_bond_amount_by_council() -> Weight {
		(367_505_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_funder_state_bloat_bond_amount_by_member() -> Weight {
		(613_784_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_oracle_reward_by_oracle_council() -> Weight {
		(732_811_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_oracle_reward_by_oracle_member() -> Weight {
		(977_437_000 as Weight)
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
}
