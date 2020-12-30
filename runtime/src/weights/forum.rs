//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl forum::WeightInfo for WeightInfo {
    fn create_category(i: u32, j: u32) -> Weight {
        (631_476_000 as Weight)
            .saturating_add((55_290_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((161_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_category_membership_of_moderator(i: u32) -> Weight {
        (467_944_000 as Weight)
            .saturating_add((28_940_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_archival_status(i: u32) -> Weight {
        (385_266_000 as Weight)
            .saturating_add((88_031_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_category(i: u32) -> Weight {
        (345_791_000 as Weight)
            .saturating_add((108_329_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn create_thread(i: u32, j: u32, k: u32) -> Weight {
        (390_747_000 as Weight)
            .saturating_add((115_660_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((162_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((14_114_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(8 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn edit_thread_title(i: u32, j: u32) -> Weight {
        (468_008_000 as Weight)
            .saturating_add((95_367_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((79_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_thread_archival_status(i: u32) -> Weight {
        (514_424_000 as Weight)
            .saturating_add((172_248_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_thread(i: u32) -> Weight {
        (855_303_000 as Weight)
            .saturating_add((89_267_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(22 as Weight))
    }
    fn move_thread_to_category(i: u32) -> Weight {
        (761_056_000 as Weight)
            .saturating_add((143_287_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn vote_on_poll(i: u32, j: u32) -> Weight {
        (548_167_000 as Weight)
            .saturating_add((95_874_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((32_120_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_thread(i: u32, j: u32) -> Weight {
        (777_889_000 as Weight)
            .saturating_add((110_233_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((237_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(22 as Weight))
    }
    fn add_post(i: u32, j: u32) -> Weight {
        (601_342_000 as Weight)
            .saturating_add((81_573_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((79_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn react_post(i: u32) -> Weight {
        (682_564_000 as Weight)
            .saturating_add((87_829_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
    }
    fn edit_post_text(i: u32, j: u32) -> Weight {
        (737_358_000 as Weight)
            .saturating_add((99_006_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((79_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_post(i: u32, j: u32) -> Weight {
        (1_522_139_000 as Weight)
            .saturating_add((167_569_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((223_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn set_stickied_threads(i: u32, j: u32) -> Weight {
        (402_844_000 as Weight)
            .saturating_add((104_128_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((344_596_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
