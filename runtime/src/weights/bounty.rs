//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
	fn create_bounty_by_council(i: u32, j: u32, ) -> Weight {
		(362_598_000 as Weight)
			.saturating_add((168_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((5_849_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn create_bounty_by_member(i: u32, j: u32, ) -> Weight {
		(613_607_000 as Weight)
			.saturating_add((166_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((6_524_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn cancel_bounty_by_council() -> Weight {
		(721_078_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn cancel_bounty_by_member() -> Weight {
		(1_248_464_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn veto_bounty() -> Weight {
		(687_556_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn fund_bounty_by_member() -> Weight {
		(784_240_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn fund_bounty_by_council() -> Weight {
		(491_642_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funding_by_member() -> Weight {
		(1_085_334_000 as Weight)
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(5 as Weight))
	}
	fn withdraw_funding_by_council() -> Weight {
		(813_067_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn announce_work_entry(i: u32, ) -> Weight {
		(708_853_000 as Weight)
			.saturating_add((7_630_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(5 as Weight))
	}
	fn withdraw_work_entry() -> Weight {
		(409_487_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn submit_work(i: u32, ) -> Weight {
		(349_833_000 as Weight)
			.saturating_add((165_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn submit_oracle_judgment_by_council_all_winners(i: u32, ) -> Weight {
		(589_908_000 as Weight)
			.saturating_add((299_820_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_council_all_rejected(i: u32, ) -> Weight {
		(506_207_000 as Weight)
			.saturating_add((103_077_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_winners(i: u32, ) -> Weight {
		(1_082_713_000 as Weight)
			.saturating_add((298_068_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(4 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_rejected(i: u32, ) -> Weight {
		(930_911_000 as Weight)
			.saturating_add((102_491_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn withdraw_work_entrant_funds() -> Weight {
		(973_633_000 as Weight)
			.saturating_add(DbWeight::get().reads(7 as Weight))
			.saturating_add(DbWeight::get().writes(5 as Weight))
	}
	fn switch_oracle_to_member_by_oracle_council() -> Weight {
		(368_036_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_not_oracle_council() -> Weight {
		(367_397_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_oracle_member() -> Weight {
		(438_778_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_council_by_oracle_member() -> Weight {
		(354_735_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn end_working_period() -> Weight {
		(355_201_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn terminate_bounty() -> Weight {
		(475_942_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn work_entrants_stake_account_action(i: u32, j: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((6_333_016_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((11_000_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
}
