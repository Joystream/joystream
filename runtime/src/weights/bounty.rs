//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
	fn create_bounty_by_council(i: u32, j: u32, ) -> Weight {
		(652_500_000 as Weight)
			.saturating_add((247_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((9_081_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn create_bounty_by_member(i: u32, j: u32, ) -> Weight {
		(1_177_497_000 as Weight)
			.saturating_add((246_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((3_704_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn cancel_bounty_by_council() -> Weight {
		(750_529_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn cancel_bounty_by_member() -> Weight {
		(1_231_951_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn veto_bounty() -> Weight {
		(750_237_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn fund_bounty_by_member() -> Weight {
		(1_156_302_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn fund_bounty_by_council() -> Weight {
		(755_900_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funding_by_member() -> Weight {
		(1_442_204_000 as Weight)
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funding_by_council() -> Weight {
		(1_031_991_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn announce_work_entry(i: u32, ) -> Weight {
		(1_066_657_000 as Weight)
			.saturating_add((11_895_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(5 as Weight))
	}
	fn withdraw_work_entry() -> Weight {
		(1_339_077_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn submit_work(i: u32, ) -> Weight {
		(729_723_000 as Weight)
			.saturating_add((248_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn submit_oracle_judgment_by_council_all_winners(i: u32, ) -> Weight {
		(614_242_000 as Weight)
			.saturating_add((197_714_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_council_all_rejected(i: u32, ) -> Weight {
		(425_144_000 as Weight)
			.saturating_add((887_466_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_winners(i: u32, ) -> Weight {
		(1_179_720_000 as Weight)
			.saturating_add((193_462_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_rejected(i: u32, ) -> Weight {
		(273_501_000 as Weight)
			.saturating_add((836_822_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn withdraw_work_entrant_funds() -> Weight {
		(1_816_600_000 as Weight)
			.saturating_add(DbWeight::get().reads(8 as Weight))
			.saturating_add(DbWeight::get().writes(6 as Weight))
	}
	fn entrant_remark() -> Weight {
		(360_023_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
	}
	fn contributor_remark() -> Weight {
		(304_679_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
	}
	fn oracle_remark() -> Weight {
		(261_869_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
	}
	fn creator_remark() -> Weight {
		(261_289_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
	}
}
