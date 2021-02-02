//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl proposals_engine::WeightInfo for WeightInfo {
    fn vote(i: u32) -> Weight {
        (485_352_000 as Weight)
            .saturating_add((39_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    // WARNING! Some components were not used: ["i"]
    fn cancel_proposal() -> Weight {
        (1_126_523_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(8 as Weight))
    }
    fn veto_proposal() -> Weight {
        (479_000_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(8 as Weight))
    }
    fn on_initialize_immediate_execution_decode_fails(i: u32) -> Weight {
        (79_260_000 as Weight)
            .saturating_add((740_840_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((4 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((7 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_pending_execution_decode_fails(i: u32) -> Weight {
        (49_200_000 as Weight)
            .saturating_add((330_580_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((2 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((5 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_approved_pending_constitutionality(i: u32) -> Weight {
        (67_720_000 as Weight)
            .saturating_add((363_000_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_rejected(i: u32) -> Weight {
        (81_920_000 as Weight)
            .saturating_add((1_041_560_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((9 as Weight).saturating_mul(i as Weight)))
    }
    fn on_initialize_slashed(i: u32) -> Weight {
        (0 as Weight)
            .saturating_add((871_510_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((9 as Weight).saturating_mul(i as Weight)))
    }
    fn cancel_active_and_pending_proposals(i: u32) -> Weight {
        (120_990_000 as Weight)
            .saturating_add((505_390_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
            .saturating_add(DbWeight::get().writes((9 as Weight).saturating_mul(i as Weight)))
    }
}
