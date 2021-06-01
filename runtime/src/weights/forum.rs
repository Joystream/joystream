//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl forum::WeightInfo for WeightInfo {
    fn create_category(i: u32, j: u32, k: u32) -> Weight {
        (0 as Weight)
            .saturating_add((244_424_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((108_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((149_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_category_membership_of_moderator_new() -> Weight {
        (318_667_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_membership_of_moderator_old() -> Weight {
        (340_448_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_archival_status_lead(i: u32) -> Weight {
        (191_321_000 as Weight)
            .saturating_add((62_117_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_category_archival_status_moderator(i: u32) -> Weight {
        (213_940_000 as Weight)
            .saturating_add((58_413_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_category_lead(i: u32) -> Weight {
        (152_811_000 as Weight)
            .saturating_add((70_445_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn delete_category_moderator(i: u32) -> Weight {
        (168_140_000 as Weight)
            .saturating_add((72_252_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    // WARNING! Some components were not used: ["z"]
    fn create_thread(j: u32, k: u32, i: u32) -> Weight {
        (1_988_301_000 as Weight)
            .saturating_add((144_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((190_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(7 as Weight))
    }
    fn edit_thread_title(i: u32, j: u32) -> Weight {
        (249_076_000 as Weight)
            .saturating_add((65_112_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((145_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_thread(i: u32) -> Weight {
        (745_492_000 as Weight)
            .saturating_add((61_494_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(102 as Weight))
    }
    fn move_thread_to_category_lead(i: u32) -> Weight {
        (392_377_000 as Weight)
            .saturating_add((107_424_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn move_thread_to_category_moderator(i: u32) -> Weight {
        (429_980_000 as Weight)
            .saturating_add((107_333_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn vote_on_poll(i: u32, j: u32) -> Weight {
        (331_092_000 as Weight)
            .saturating_add((64_865_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((20_909_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn moderate_thread_lead(i: u32, k: u32) -> Weight {
        (570_691_000 as Weight)
            .saturating_add((63_690_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((142_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn moderate_thread_moderator(i: u32, k: u32) -> Weight {
        (555_260_000 as Weight)
            .saturating_add((65_443_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((143_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn add_post(i: u32, j: u32) -> Weight {
        (628_419_000 as Weight)
            .saturating_add((59_569_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((145_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn react_post(i: u32) -> Weight {
        (330_603_000 as Weight)
            .saturating_add((61_553_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
    }
    fn edit_post_text(i: u32, j: u32) -> Weight {
        (477_603_000 as Weight)
            .saturating_add((63_656_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((145_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_post_lead(i: u32, j: u32) -> Weight {
        (1_061_737_000 as Weight)
            .saturating_add((125_999_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((142_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn moderate_post_moderator(i: u32, j: u32) -> Weight {
        (992_903_000 as Weight)
            .saturating_add((134_194_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((145_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn delete_posts(i: u32, j: u32, k: u32) -> Weight {
        (0 as Weight)
            .saturating_add((30_679_118_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((27_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((1_545_369_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(k as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(k as Weight)))
    }
    fn set_stickied_threads_lead(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((103_175_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((232_740_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_stickied_threads_moderator(i: u32, j: u32) -> Weight {
        (20_591_000 as Weight)
            .saturating_add((72_609_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((233_007_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
