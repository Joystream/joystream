//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 2.0.1

#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::weights::{constants::RocksDbWeight as DbWeight, Weight};

pub struct WeightInfo;
impl storage::WeightInfo for WeightInfo {
    fn delete_storage_bucket() -> Weight {
        (264_075_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_uploading_blocked_status() -> Weight {
        (235_451_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_data_size_fee() -> Weight {
        (202_095_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_buckets_per_bag_limit() -> Weight {
        (231_328_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_buckets_voucher_max_limits() -> Weight {
        (234_725_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy() -> Weight {
        (349_112_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_blacklist(i: u32, j: u32) -> Weight {
        (17_332_614_000 as Weight)
            .saturating_add((83_179_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((37_985_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn create_storage_bucket() -> Weight {
        (236_492_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_storage_buckets_for_bag(i: u32, j: u32) -> Weight {
        (404_085_000 as Weight)
            .saturating_add((266_590_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((221_139_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn cancel_storage_bucket_operator_invite() -> Weight {
        (295_703_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn invite_storage_bucket_operator() -> Weight {
        (524_963_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_storage_bucket_operator() -> Weight {
        (314_556_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_storage_bucket_status() -> Weight {
        (326_587_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_storage_bucket_voucher_limits() -> Weight {
        (324_253_000 as Weight)
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn accept_storage_bucket_invitation() -> Weight {
        (297_798_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_storage_operator_metadata(i: u32) -> Weight {
        (275_715_000 as Weight)
            .saturating_add((172_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn accept_pending_data_objects(i: u32) -> Weight {
        (255_615_000 as Weight)
            .saturating_add((139_530_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
    }
    fn create_distribution_bucket_family() -> Weight {
        (218_919_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(3 as Weight))
    }
    fn delete_distribution_bucket_family() -> Weight {
        (343_995_000 as Weight)
            .saturating_add(DbWeight::get().reads(7 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn create_distribution_bucket() -> Weight {
        (267_467_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(2 as Weight))
    }
    fn update_distribution_bucket_status() -> Weight {
        (322_565_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn delete_distribution_bucket() -> Weight {
        (426_792_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_distribution_buckets_for_bag(i: u32, j: u32) -> Weight {
        (0 as Weight)
            .saturating_add((151_196_000 as Weight).saturating_mul(i as Weight))
            .saturating_add((160_209_000 as Weight).saturating_mul(j as Weight))
            .saturating_add(DbWeight::get().reads(5 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(j as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes((1 as Weight).saturating_mul(j as Weight)))
    }
    fn update_distribution_buckets_per_bag_limit() -> Weight {
        (181_614_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_distribution_bucket_mode() -> Weight {
        (328_580_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn update_families_in_dynamic_bag_creation_policy(i: u32) -> Weight {
        (251_916_000 as Weight)
            .saturating_add((43_926_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().reads((1 as Weight).saturating_mul(i as Weight)))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn invite_distribution_bucket_operator() -> Weight {
        (466_366_000 as Weight)
            .saturating_add(DbWeight::get().reads(4 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn cancel_distribution_bucket_operator_invite() -> Weight {
        (350_614_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn remove_distribution_bucket_operator() -> Weight {
        (326_586_000 as Weight)
            .saturating_add(DbWeight::get().reads(3 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_distribution_bucket_family_metadata(i: u32) -> Weight {
        (224_534_000 as Weight)
            .saturating_add((298_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(3 as Weight))
    }
    fn accept_distribution_bucket_invitation() -> Weight {
        (385_313_000 as Weight)
            .saturating_add(DbWeight::get().reads(2 as Weight))
            .saturating_add(DbWeight::get().writes(1 as Weight))
    }
    fn set_distribution_operator_metadata(i: u32) -> Weight {
        (443_529_000 as Weight)
            .saturating_add((69_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn storage_operator_remark(i: u32) -> Weight {
        (271_675_000 as Weight)
            .saturating_add((196_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
    fn distribution_operator_remark(i: u32) -> Weight {
        (293_456_000 as Weight)
            .saturating_add((155_000 as Weight).saturating_mul(i as Weight))
            .saturating_add(DbWeight::get().reads(2 as Weight))
    }
}
