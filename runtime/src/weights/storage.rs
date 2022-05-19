//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl storage::WeightInfo for WeightInfo {
    fn delete_storage_bucket() -> Weight {
        (292_930_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_uploading_blocked_status() -> Weight {
        (179_637_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_data_size_fee() -> Weight {
        (218_220_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_buckets_per_bag_limit() -> Weight {
        (183_342_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_buckets_voucher_max_limits() -> Weight {
        (190_444_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy() -> Weight {
        (220_859_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_blacklist(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((80_677_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((37_718_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn create_storage_bucket() -> Weight {
        (241_491_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_storage_buckets_for_bag(i: u32, j: u32) -> Weight {
        (437_741_000 as Weight)
            .saturating_add((272_320_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((210_238_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn cancel_storage_bucket_operator_invite() -> Weight {
        (334_063_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn invite_storage_bucket_operator() -> Weight {
        (416_183_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_storage_bucket_operator() -> Weight {
        (333_370_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_bucket_status() -> Weight {
        (291_690_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_storage_bucket_voucher_limits() -> Weight {
        (304_724_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn accept_storage_bucket_invitation() -> Weight {
        (293_442_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_storage_operator_metadata(i: u32) -> Weight {
        (255_110_000 as Weight)
            .saturating_add((165_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn accept_pending_data_objects(i: u32) -> Weight {
        (0 as Weight)
            .saturating_add((136_049_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn create_distribution_bucket_family() -> Weight {
        (232_223_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn delete_distribution_bucket_family() -> Weight {
        (399_997_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn create_distribution_bucket() -> Weight {
        (335_270_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_distribution_bucket_status() -> Weight {
        (279_378_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_distribution_bucket() -> Weight {
        (261_923_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_distribution_buckets_for_bag(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((133_180_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((151_708_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn update_distribution_buckets_per_bag_limit() -> Weight {
        (210_197_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_distribution_bucket_mode() -> Weight {
        (287_201_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_families_in_dynamic_bag_creation_policy(i: u32) -> Weight {
        (284_579_000 as Weight)
            .saturating_add((42_242_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn invite_distribution_bucket_operator() -> Weight {
        (465_074_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn cancel_distribution_bucket_operator_invite() -> Weight {
        (303_655_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_distribution_bucket_operator() -> Weight {
        (331_922_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_distribution_bucket_family_metadata(i: u32) -> Weight {
        (223_235_000 as Weight)
            .saturating_add((158_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
    }
    fn accept_distribution_bucket_invitation() -> Weight {
        (296_725_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_distribution_operator_metadata(i: u32) -> Weight {
        (251_248_000 as Weight)
            .saturating_add((187_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn storage_operator_remark(i: u32) -> Weight {
        (261_060_000 as Weight)
            .saturating_add((158_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn distribution_operator_remark(i: u32) -> Weight {
        (247_631_000 as Weight)
            .saturating_add((188_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
}
