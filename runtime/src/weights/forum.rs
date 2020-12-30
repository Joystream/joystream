//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl forum::WeightInfo for WeightInfo {
    fn create_category(j: u32) -> Weight {
        (1_191_268_000 as Weight)
            .saturating_add((137_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn update_category_membership_of_moderator(i: u32) -> Weight {
        (468_391_000 as Weight)
            .saturating_add((30_963_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_archival_status() -> Weight {
        (732_069_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_category() -> Weight {
        (779_355_000 as Weight)
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn create_thread(j: u32, i: u32) -> Weight {
        (926_921_000 as Weight)
            .saturating_add((162_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((8_925_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(11 as Weight))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn edit_thread_title(j: u32) -> Weight {
        (837_426_000 as Weight)
            .saturating_add((83_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_thread_archival_status() -> Weight {
        (1_241_769_000 as Weight)
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_thread() -> Weight {
        (1_253_622_000 as Weight)
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().writes(22 as Weight))
    }
    fn move_thread_to_category() -> Weight {
        (1_356_642_000 as Weight)
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn vote_on_poll(i: u32) -> Weight {
        (914_355_000 as Weight)
            .saturating_add((33_864_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_thread(i: u32) -> Weight {
        (1_238_371_000 as Weight)
            .saturating_add((234_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().writes(22 as Weight))
    }
    fn add_post(i: u32) -> Weight {
        (922_212_000 as Weight)
            .saturating_add((78_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn react_post() -> Weight {
        (1_039_552_000 as Weight).saturating_add(DbWeight::get().reads(8 as Weight))
    }
    fn edit_post_text(i: u32) -> Weight {
        (2_424_803_000 as Weight)
            .saturating_add((1_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_post(i: u32) -> Weight {
        (1_979_246_000 as Weight)
            .saturating_add((239_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(9 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn set_stickied_threads(i: u32) -> Weight {
        (575_507_000 as Weight)
            .saturating_add((381_753_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
