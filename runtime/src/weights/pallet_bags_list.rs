// This file is part of Substrate.

// Copyright (C) 2022 Parity Technologies (UK) Ltd.
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//! Autogenerated weights for pallet_bags_list
//!
//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-07-31, STEPS: `50`, REPEAT: 20, LOW RANGE: `[]`, HIGH RANGE: `[]`
//! EXECUTION: Some(Wasm), WASM-EXECUTION: Compiled, CHAIN: Some("prod-test"), DB CACHE: 1024

// Executed Command:
// ./../target/release/joystream-node
// benchmark
// pallet
// --pallet=pallet_bags_list
// --extrinsic=*
// --chain=prod-test
// --steps=50
// --repeat=20
// --execution=wasm
// --template=./../devops/frame-weight-template.hbs
// --output=./../runtime/src/weights/pallet_bags_list.rs

#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(unused_parens)]
#![allow(unused_imports)]
#![allow(unused_variables)]

use frame_support::{traits::Get, weights::Weight};
use sp_std::marker::PhantomData;

pub use pallet_bags_list::weights::WeightInfo;

/// Weights for pallet_bags_list using the Substrate node and recommended hardware.
pub struct SubstrateWeight<T>(PhantomData<T>);
impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {
	// Storage: Staking Bonded (r:1 w:0)
	// Proof: Staking Bonded (max_values: None, max_size: Some(72), added: 2547, mode: MaxEncodedLen)
	// Storage: Staking Ledger (r:1 w:0)
	// Proof: Staking Ledger (max_values: None, max_size: Some(1235), added: 3710, mode: MaxEncodedLen)
	// Storage: BagsList ListNodes (r:4 w:4)
	// Proof: BagsList ListNodes (max_values: None, max_size: Some(154), added: 2629, mode: MaxEncodedLen)
	// Storage: BagsList ListBags (r:1 w:1)
	// Proof: BagsList ListBags (max_values: None, max_size: Some(82), added: 2557, mode: MaxEncodedLen)
	fn rebag_non_terminal() -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `1797`
		//  Estimated: `19330`
		// Minimum execution time: 47_000 nanoseconds.
		Weight::from_parts(49_000_000, 0u64)
			.saturating_add(Weight::from_proof_size(19330))
			.saturating_add(T::DbWeight::get().reads(7_u64))
			.saturating_add(T::DbWeight::get().writes(5_u64))
	}
	// Storage: Staking Bonded (r:1 w:0)
	// Proof: Staking Bonded (max_values: None, max_size: Some(72), added: 2547, mode: MaxEncodedLen)
	// Storage: Staking Ledger (r:1 w:0)
	// Proof: Staking Ledger (max_values: None, max_size: Some(1235), added: 3710, mode: MaxEncodedLen)
	// Storage: BagsList ListNodes (r:3 w:3)
	// Proof: BagsList ListNodes (max_values: None, max_size: Some(154), added: 2629, mode: MaxEncodedLen)
	// Storage: BagsList ListBags (r:2 w:2)
	// Proof: BagsList ListBags (max_values: None, max_size: Some(82), added: 2557, mode: MaxEncodedLen)
	fn rebag_terminal() -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `1691`
		//  Estimated: `19258`
		// Minimum execution time: 46_000 nanoseconds.
		Weight::from_parts(48_000_000, 0u64)
			.saturating_add(Weight::from_proof_size(19258))
			.saturating_add(T::DbWeight::get().reads(7_u64))
			.saturating_add(T::DbWeight::get().writes(5_u64))
	}
	// Storage: BagsList ListNodes (r:4 w:4)
	// Proof: BagsList ListNodes (max_values: None, max_size: Some(154), added: 2629, mode: MaxEncodedLen)
	// Storage: Staking Bonded (r:2 w:0)
	// Proof: Staking Bonded (max_values: None, max_size: Some(72), added: 2547, mode: MaxEncodedLen)
	// Storage: Staking Ledger (r:2 w:0)
	// Proof: Staking Ledger (max_values: None, max_size: Some(1235), added: 3710, mode: MaxEncodedLen)
	// Storage: BagsList CounterForListNodes (r:1 w:1)
	// Proof: BagsList CounterForListNodes (max_values: Some(1), max_size: Some(4), added: 499, mode: MaxEncodedLen)
	// Storage: BagsList ListBags (r:1 w:1)
	// Proof: BagsList ListBags (max_values: None, max_size: Some(82), added: 2557, mode: MaxEncodedLen)
	fn put_in_front_of() -> Weight {
		// Proof Size summary in bytes:
		//  Measured:  `2035`
		//  Estimated: `26086`
		// Minimum execution time: 53_000 nanoseconds.
		Weight::from_parts(54_000_000, 0u64)
			.saturating_add(Weight::from_proof_size(26086))
			.saturating_add(T::DbWeight::get().reads(10_u64))
			.saturating_add(T::DbWeight::get().writes(6_u64))
	}
}
