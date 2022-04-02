//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
	fn create_bounty_by_council(i: u32, j: u32, ) -> Weight {
		(568_238_000 as Weight)
			.saturating_add((157_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((1_597_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn create_bounty_by_member(i: u32, j: u32, ) -> Weight {
		(654_098_000 as Weight)
			.saturating_add((157_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((4_856_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn cancel_bounty_by_council() -> Weight {
		(416_912_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn cancel_bounty_by_member() -> Weight {
		(652_400_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn fund_bounty_by_member() -> Weight {
		(757_645_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn fund_bounty_by_council() -> Weight {
		(495_763_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funding_by_member() -> Weight {
		(616_847_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_funding_by_council() -> Weight {
		(371_359_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn announce_work_entry(i: u32, ) -> Weight {
		(690_776_000 as Weight)
			.saturating_add((7_181_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(5 as Weight))
	}
	fn submit_work(i: u32, ) -> Weight {
		(363_939_000 as Weight)
			.saturating_add((157_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn submit_oracle_judgment_by_council_all_winners(i: u32, ) -> Weight {
		(400_663_000 as Weight)
			.saturating_add((785_413_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_council_all_rejected(i: u32, j: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((9_649_305_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((18_082_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_winners(i: u32, ) -> Weight {
		(490_263_000 as Weight)
			.saturating_add((786_680_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(3 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn submit_oracle_judgment_by_member_all_rejected(i: u32, j: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((9_652_425_000 as Weight).saturating_mul(i as Weight))
			.saturating_add((18_077_000 as Weight).saturating_mul(j as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(1 as Weight))
			.saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
	}
	fn switch_oracle_to_council_by_council_approval_successful() -> Weight {
		(269_767_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_oracle_council() -> Weight {
		(343_716_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_council_not_oracle() -> Weight {
		(347_483_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_member_by_oracle_member() -> Weight {
		(426_720_000 as Weight)
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn switch_oracle_to_council_by_oracle_member() -> Weight {
		(349_303_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn end_working_period() -> Weight {
		(347_045_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn terminate_bounty() -> Weight {
		(268_245_000 as Weight)
			.saturating_add(DbWeight::get().reads(1 as Weight))
			.saturating_add(DbWeight::get().writes(1 as Weight))
	}
	fn unlock_work_entrant_stake() -> Weight {
		(561_761_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
	fn withdraw_funder_state_bloat_bond_amount_by_council() -> Weight {
		(374_501_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_funder_state_bloat_bond_amount_by_member() -> Weight {
		(618_959_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_oracle_reward_by_oracle_council() -> Weight {
		(778_602_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(3 as Weight))
	}
	fn withdraw_oracle_reward_by_oracle_member() -> Weight {
		(1_021_672_000 as Weight)
			.saturating_add(DbWeight::get().reads(6 as Weight))
			.saturating_add(DbWeight::get().writes(4 as Weight))
	}
}
