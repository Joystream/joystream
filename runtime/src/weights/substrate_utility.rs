//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl substrate_utility::WeightInfo for WeightInfo {
    fn batch(c: u32) -> Weight {
        (20_071_000 as Weight).saturating_add((2_739_000 as Weight).saturating_mul(c as Weight))
    }
    fn as_derivative() -> Weight {
        (5_721_000 as Weight)
    }
    fn batch_all(c: u32) -> Weight {
        (21_440_000 as Weight).saturating_add((2_738_000 as Weight).saturating_mul(c as Weight))
    }
}
