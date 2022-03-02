//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{Weight, constants::RocksDbWeight as DbWeight};

pub struct WeightInfo;
impl proposals_engine::WeightInfo for WeightInfo {
	fn vote(i: u32, ) -> Weight {
		(674_206_000 as Weight)
			.saturating_add((261_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(2 as Weight))
	}
	fn cancel_proposal() -> Weight {
		(1_471_478_000 as Weight)
			.saturating_add(DbWeight::get().reads(5 as Weight))
			.saturating_add(DbWeight::get().writes(7 as Weight))
	}
	fn veto_proposal() -> Weight {
		(643_564_000 as Weight)
			.saturating_add(DbWeight::get().reads(4 as Weight))
			.saturating_add(DbWeight::get().writes(7 as Weight))
	}
	fn proposer_remark() -> Weight {
		(364_753_000 as Weight)
			.saturating_add(DbWeight::get().reads(2 as Weight))
	}
	fn on_initialize_immediate_execution_decode_fails(i: u32, ) -> Weight {
		(0 as Weight)
			.saturating_add((1_069_166_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((6 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_pending_execution_decode_fails(i: u32, ) -> Weight {
		(25_079_000 as Weight)
			.saturating_add((469_174_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((4 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_approved_pending_constitutionality(i: u32, ) -> Weight {
		(11_916_000 as Weight)
			.saturating_add((594_135_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_rejected(i: u32, ) -> Weight {
		(66_863_000 as Weight)
			.saturating_add((1_481_979_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
	fn on_initialize_slashed(i: u32, ) -> Weight {
		(279_826_000 as Weight)
			.saturating_add((1_112_286_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(3 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
	fn cancel_active_and_pending_proposals(i: u32, ) -> Weight {
		(164_471_000 as Weight)
			.saturating_add((574_254_000 as Weight).saturating_mul(i as Weight))
			.saturating_add(DbWeight::get().reads(2 as Weight))
			.saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
			.saturating_add(DbWeight::get().writes(2 as Weight))
			.saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
	}
}
