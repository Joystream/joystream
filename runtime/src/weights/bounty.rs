//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl bounty::WeightInfo for WeightInfo {
    fn create_bounty_by_council(i: u32, j: u32) -> Weight {
        (416_534_000 as Weight)
            .saturating_add((167_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((5_362_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn create_bounty_by_member(i: u32, j: u32) -> Weight {
        (695_781_000 as Weight)
            .saturating_add((168_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((4_755_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn cancel_bounty_by_council() -> Weight {
        (701_131_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn cancel_bounty_by_member() -> Weight {
        (1_302_327_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn veto_bounty() -> Weight {
        (682_409_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn fund_bounty_by_member() -> Weight {
        (865_019_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn fund_bounty_by_council() -> Weight {
        (516_434_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn withdraw_funding_by_member() -> Weight {
        (1_102_202_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn withdraw_funding_by_council() -> Weight {
        (864_672_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn announce_work_entry(i: u32) -> Weight {
        (734_866_000 as Weight)
            .saturating_add((8_316_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn submit_work(i: u32) -> Weight {
        (405_782_000 as Weight)
            .saturating_add((167_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn submit_oracle_judgment_by_council_all_winners(i: u32) -> Weight {
        (680_191_000 as Weight)
            .saturating_add((311_771_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_council_all_rejected(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((10_136_855_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((19_132_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_winners(i: u32) -> Weight {
        (797_988_000 as Weight)
            .saturating_add((318_091_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn submit_oracle_judgment_by_member_all_rejected(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((10_125_039_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((19_048_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((3 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((3 as Weight).saturating_mul(i as Weight)))
    }
    fn withdraw_work_entrant_funds() -> Weight {
        (962_354_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn switch_oracle_to_council_by_council_approval_successful() -> Weight {
        (281_287_000 as Weight)
            .saturating_add(DbWeight::get().reads(1 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_oracle_council() -> Weight {
        (360_377_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_not_oracle_council() -> Weight {
        (366_893_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_member_by_oracle_member() -> Weight {
        (443_217_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn switch_oracle_to_council_by_oracle_member() -> Weight {
        (357_889_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn end_working_period() -> Weight {
        (356_408_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn terminate_bounty() -> Weight {
        (484_814_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn unlock_work_entrant_stake() -> Weight {
        (700_261_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
}
