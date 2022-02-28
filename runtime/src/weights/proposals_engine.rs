//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl proposals_engine::WeightInfo for WeightInfo {
	fn vote(i: u32, ) -> Weight {
		(580_205_000 as Weight)
			.saturating_add((298_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn cancel_proposal(i: u32, ) -> Weight {
		(1_584_595_000 as Weight)
			.saturating_add((12_169_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(7 as Weight))
	}
	fn veto_proposal() -> Weight {
		(798_280_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(7 as Weight))
	}
	fn proposer_remark() -> Weight {
		(470_074_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
	}
	fn on_initialize_immediate_execution_decode_fails(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((1_689_590_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((6 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_pending_execution_decode_fails(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((515_371_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((4 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_approved_pending_constitutionality(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((730_911_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_rejected(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((1_769_062_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_slashed(i: u32, ) -> Weight {
		(2_367_971_000 as Weight)
			.saturating_add((1_266_709_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
	fn cancel_active_and_pending_proposals(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((752_601_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
}
