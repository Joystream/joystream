//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.0

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl forum::WeightInfo for WeightInfo {
    fn create_category(i: u32, j: u32, k: u32) -> Weight {
        (0 as Weight)
            .saturating_add((536_866_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((206_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((58_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn update_category_membership_of_moderator_new() -> Weight {
        (769_077_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_membership_of_moderator_old() -> Weight {
        (844_050_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_category_archival_status_lead(i: u32) -> Weight {
        (579_518_000 as Weight)
            .saturating_add((148_741_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_category_archival_status_moderator(i: u32) -> Weight {
        (695_186_000 as Weight)
            .saturating_add((90_362_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_category_lead(i: u32) -> Weight {
        (475_589_000 as Weight)
            .saturating_add((137_382_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn delete_category_moderator(i: u32) -> Weight {
        (491_714_000 as Weight)
            .saturating_add((143_917_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
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
        (379_562_000 as Weight)
            .saturating_add((210_957_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((83_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_thread_archival_status_lead(i: u32) -> Weight {
        (532_961_000 as Weight)
            .saturating_add((233_514_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_thread_archival_status_moderator(i: u32) -> Weight {
        (688_504_000 as Weight)
            .saturating_add((197_194_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_thread_lead(i: u32) -> Weight {
        (1_030_000_000 as Weight)
            .saturating_add((148_165_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(22 as Weight))
    }
    fn delete_thread_moderator(i: u32) -> Weight {
        (1_260_738_000 as Weight)
            .saturating_add((122_231_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(22 as Weight))
    }
    fn move_thread_to_category_lead(i: u32) -> Weight {
        (977_047_000 as Weight)
            .saturating_add((205_129_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn move_thread_to_category_moderator(i: u32) -> Weight {
        (931_744_000 as Weight)
            .saturating_add((206_882_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(6 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(4 as Weight))
    }
    fn vote_on_poll(i: u32, j: u32) -> Weight {
        (933_414_000 as Weight)
            .saturating_add((169_101_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((33_456_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_thread_lead(i: u32, j: u32, k: u32) -> Weight {
        (1_339_536_000 as Weight)
            .saturating_add((157_127_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((5_014_000 as Weight).saturating_mul(j as Weight))
            .saturating_add((339_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn moderate_thread_moderator(k: u32, i: u32, j: u32) -> Weight {
        (6_048_919_000 as Weight)
            .saturating_add((270_000 as Weight).saturating_mul(k as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn add_post(i: u32, j: u32) -> Weight {
        (544_287_000 as Weight)
            .saturating_add((84_358_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((83_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn react_post(i: u32) -> Weight {
        (624_679_000 as Weight)
            .saturating_add((90_554_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
    }
    fn edit_post_text(i: u32, j: u32) -> Weight {
        (623_715_000 as Weight)
            .saturating_add((110_140_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((83_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn moderate_post_lead(i: u32, j: u32) -> Weight {
        (1_265_038_000 as Weight)
            .saturating_add((179_219_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((240_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn moderate_post_moderator(i: u32, j: u32) -> Weight {
        (1_156_880_000 as Weight)
            .saturating_add((193_169_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((243_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn set_stickied_threads_lead(i: u32, j: u32) -> Weight {
        (647_830_000 as Weight)
            .saturating_add((53_426_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((356_269_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_stickied_threads_moderator(i: u32, j: u32) -> Weight {
        (479_755_000 as Weight)
            .saturating_add((78_709_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((354_352_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
}
