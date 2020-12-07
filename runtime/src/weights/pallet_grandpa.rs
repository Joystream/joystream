//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl pallet_grandpa::WeightInfo for WeightInfo {
    fn check_equivocation_proof(x: u32) -> Weight {
        (172_245_000 as Weight).saturating_add((1_175_000 as Weight).saturating_mul(x as Weight))
    }
    fn note_stalled() -> Weight {
        (12_763_000 as Weight).saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
