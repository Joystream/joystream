//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl forum::WeightInfo for WeightInfo {
    fn create_category(i: u32, j: u32, k: u32) -> Weight {
        (0 as Weight)
            .saturating_add((214_529_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((98_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((134_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_category_membership_of_moderator_new() -> Weight {
        (297_135_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_membership_of_moderator_old() -> Weight {
        (315_520_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_archival_status_lead(i: u32) -> Weight {
        (177_097_000 as Weight)
            .saturating_add((57_774_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_category_archival_status_moderator(i: u32) -> Weight {
        (195_602_000 as Weight)
            .saturating_add((57_023_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_category_lead(i: u32) -> Weight {
        (142_929_000 as Weight)
            .saturating_add((68_133_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn delete_category_moderator(i: u32) -> Weight {
        (184_678_000 as Weight)
            .saturating_add((63_220_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    // WARNING! Some components were not used: ["z"]
    fn create_thread(j: u32, k: u32, i: u32) -> Weight {
        (1_763_250_000 as Weight)
            .saturating_add((122_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((171_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(7 as Weight))
    }
    fn edit_thread_title(i: u32, j: u32) -> Weight {
        (161_572_000 as Weight)
            .saturating_add((72_014_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((127_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_thread_archival_status_lead(i: u32) -> Weight {
        (212_838_000 as Weight)
            .saturating_add((116_257_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_thread_archival_status_moderator(i: u32) -> Weight {
        (237_385_000 as Weight)
            .saturating_add((114_127_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_thread(i: u32) -> Weight {
        (592_486_000 as Weight)
            .saturating_add((57_770_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn move_thread_to_category_lead(i: u32) -> Weight {
        (365_000_000 as Weight)
            .saturating_add((100_941_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn move_thread_to_category_moderator(i: u32) -> Weight {
        (400_012_000 as Weight)
            .saturating_add((101_980_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn vote_on_poll(i: u32, j: u32) -> Weight {
        (311_689_000 as Weight)
            .saturating_add((57_977_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((18_453_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    // WARNING! Some components were not used: ["j"]
    fn moderate_thread_lead(i: u32, k: u32) -> Weight {
        (533_448_000 as Weight)
            .saturating_add((57_859_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((129_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn moderate_thread_moderator(i: u32, j: u32, k: u32) -> Weight {
        (343_909_000 as Weight)
            .saturating_add((63_466_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((6_334_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((131_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn add_post(i: u32, j: u32) -> Weight {
        (584_267_000 as Weight)
            .saturating_add((54_076_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((128_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(5 as Weight))
    }
    fn react_post(i: u32) -> Weight {
        (299_480_000 as Weight)
            .saturating_add((57_223_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
    }
    fn edit_post_text(i: u32, j: u32) -> Weight {
        (387_494_000 as Weight)
            .saturating_add((70_340_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((126_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_post_lead(i: u32, j: u32) -> Weight {
        (1_094_423_000 as Weight)
            .saturating_add((103_781_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((121_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn moderate_post_moderator(i: u32, j: u32) -> Weight {
        (863_056_000 as Weight)
            .saturating_add((134_282_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((126_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn delete_posts(i: u32, j: u32, k: u32) -> Weight {
        (0 as Weight)
            .saturating_add((1_007_340_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((113_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((1_418_940_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(k as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(k as Weight)))
    }
    fn set_stickied_threads_lead(i: u32, j: u32) -> Weight {
        (219_049_000 as Weight)
            .saturating_add((59_817_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((204_099_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_stickied_threads_moderator(i: u32, j: u32) -> Weight {
        (281_825_000 as Weight)
            .saturating_add((47_851_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((203_487_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
