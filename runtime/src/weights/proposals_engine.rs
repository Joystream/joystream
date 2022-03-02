//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl proposals_engine::WeightInfo for WeightInfo {
	fn vote(i: u32, ) -> Weight {
		(721_985_000 as Weight)
			.saturating_add((252_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn cancel_proposal(i: u32, ) -> Weight {
		(1_455_576_000 as Weight)
			.saturating_add((1_422_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(7 as Weight))
	}
	fn veto_proposal() -> Weight {
		(657_102_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(7 as Weight))
	}
	fn proposer_remark() -> Weight {
		(369_775_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
	}
	fn on_initialize_immediate_execution_decode_fails(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((1_059_065_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((6 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_pending_execution_decode_fails(i: u32, ) -> Weight {
		(103_228_000 as Weight)
			.saturating_add((459_077_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((4 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_approved_pending_constitutionality(i: u32, ) -> Weight {
		(90_152_000 as Weight)
			.saturating_add((568_899_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_rejected(i: u32, ) -> Weight {
		(105_868_000 as Weight)
			.saturating_add((1_435_658_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_slashed(i: u32, ) -> Weight {
		(12_285_000 as Weight)
			.saturating_add((1_203_610_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
	fn cancel_active_and_pending_proposals(i: u32, ) -> Weight {
		(140_583_000 as Weight)
			.saturating_add((618_371_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
}
