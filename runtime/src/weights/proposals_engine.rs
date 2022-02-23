//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_engine::WeightInfo for WeightInfo {
    fn vote(i: u32) -> Weight {
        (634_538_000 as Weight)
            .saturating_add((229_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn cancel_proposal() -> Weight {
        (1_305_245_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(7 as Weight))
    }
    fn veto_proposal() -> Weight {
        (582_052_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(7 as Weight))
    }
    fn on_initialize_immediate_execution_decode_fails(i: u32) -> Weight {
        (14_933_000 as Weight)
            .saturating_add((926_514_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((6 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_pending_execution_decode_fails(i: u32) -> Weight {
        (68_880_000 as Weight)
            .saturating_add((391_590_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((4 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_approved_pending_constitutionality(i: u32) -> Weight {
        (110_245_000 as Weight)
            .saturating_add((497_391_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rejected(i: u32) -> Weight {
        (163_283_000 as Weight)
            .saturating_add((1_262_246_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_slashed(i: u32) -> Weight {
        (193_922_000 as Weight)
            .saturating_add((1_034_686_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
    }
    fn cancel_active_and_pending_proposals(i: u32) -> Weight {
        (88_145_000 as Weight)
            .saturating_add((537_208_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((8 as Weight).saturating_mul(i as Weight)))
    }

    fn proposer_remark() -> u64 {
        todo!()
    }
}
