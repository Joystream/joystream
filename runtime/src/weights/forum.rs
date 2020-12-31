//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl forum::WeightInfo for WeightInfo {
    fn create_category(i: u32, j: u32, k: u32) -> Weight {
        (1_363_759_000 as Weight)
            .saturating_add((19_278_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((50_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((76_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_category_membership_of_moderator_new() -> Weight {
        (500_435_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_membership_of_moderator_old() -> Weight {
        (511_333_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_archival_status(i: u32) -> Weight {
        (397_290_000 as Weight)
            .saturating_add((91_980_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_category(i: u32) -> Weight {
        (346_102_000 as Weight)
            .saturating_add((113_078_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn create_thread(i: u32, j: u32, k: u32, z: u32) -> Weight {
        (657_005_000 as Weight)
            .saturating_add((95_246_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((78_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((80_000 as Weight).saturating_mul(k as Weight))
            .saturating_add((9_492_000 as Weight).saturating_mul(z as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn edit_thread_title(i: u32, j: u32) -> Weight {
        (459_293_000 as Weight)
            .saturating_add((101_319_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((80_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_thread_archival_status(i: u32) -> Weight {
        (546_242_000 as Weight)
            .saturating_add((172_225_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_thread(i: u32) -> Weight {
        (879_571_000 as Weight)
            .saturating_add((91_074_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(22 as Weight))
    }
    fn move_thread_to_category(i: u32) -> Weight {
        (777_236_000 as Weight)
            .saturating_add((147_076_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn vote_on_poll(i: u32, j: u32) -> Weight {
        (550_223_000 as Weight)
            .saturating_add((99_728_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((33_379_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_thread(i: u32, j: u32, k: u32) -> Weight {
        (670_412_000 as Weight)
            .saturating_add((119_954_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((7_205_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((237_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn add_post(i: u32, j: u32) -> Weight {
        (523_937_000 as Weight)
            .saturating_add((98_619_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((80_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn react_post(i: u32) -> Weight {
        (694_814_000 as Weight)
            .saturating_add((90_128_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
    }
    fn edit_post_text(i: u32, j: u32) -> Weight {
        (756_404_000 as Weight)
            .saturating_add((100_995_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((80_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_post(i: u32, j: u32) -> Weight {
        (1_295_460_000 as Weight)
            .saturating_add((202_417_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((233_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn set_stickied_threads(i: u32, j: u32) -> Weight {
        (413_468_000 as Weight)
            .saturating_add((102_465_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((351_896_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
