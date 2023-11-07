// This file is part of Substrate.

// Copyright (C) 2020-2022 Parity Technologies (UK) Ltd.
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//! Default weights for the Babe Pallet
//! This file was not auto-generated.

use frame_support::{
    traits::Get,
    weights::{
        constants::{WEIGHT_REF_TIME_PER_MICROS, WEIGHT_REF_TIME_PER_NANOS},
        Weight,
    },
};
use sp_std::marker::PhantomData;

pub use pallet_babe::WeightInfo;

pub struct SubstrateWeight<T>(PhantomData<T>);
impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {
    fn plan_config_change() -> Weight {
        T::DbWeight::get().writes(1)
    }

    fn report_equivocation(validator_count: u32) -> Weight {
        // we take the validator set count from the membership proof to
        // calculate the weight but we set a floor of 100 validators.
        let validator_count = validator_count.max(100) as u64;

        // worst case we are considering is that the given offender
        // is backed by 200 nominators
        const MAX_NOMINATORS: u64 = 1000;

        // checking membership proof
        Weight::from_parts(35u64 * WEIGHT_REF_TIME_PER_MICROS, 0)
            .saturating_add(
                Weight::from_parts(175u64 * WEIGHT_REF_TIME_PER_NANOS, 0)
                    .saturating_mul(validator_count),
            )
            .saturating_add(T::DbWeight::get().reads(5))
            // check equivocation proof
            .saturating_add(Weight::from_parts(110u64 * WEIGHT_REF_TIME_PER_MICROS, 0))
            // report offence
            .saturating_add(Weight::from_parts(110u64 * WEIGHT_REF_TIME_PER_MICROS, 0))
            .saturating_add(Weight::from_parts(
                25u64 * WEIGHT_REF_TIME_PER_MICROS * MAX_NOMINATORS,
                0,
            ))
            .saturating_add(T::DbWeight::get().reads(14 + 3 * MAX_NOMINATORS))
            .saturating_add(T::DbWeight::get().writes(10 + 3 * MAX_NOMINATORS))
    }
}
