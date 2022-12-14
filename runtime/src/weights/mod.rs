// Copyright (C) 2020 Parity Technologies (UK) Ltd.
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

//! A list of the different weight modules for our runtime.

// Disable lints for Auto-generated code.
#![allow(clippy::unnecessary_cast)]

// Substrate FRAME pallets
pub mod block_weights;
pub mod extrinsic_weights;
pub mod frame_system;
pub mod pallet_babe;
pub mod pallet_bags_list;
pub mod pallet_balances;
pub mod pallet_election_provider_multi_phase;
pub mod pallet_election_provider_support_benchmarking;
pub mod pallet_grandpa;
pub mod pallet_im_online;
pub mod pallet_multisig;
pub mod pallet_session;
pub mod pallet_staking;
pub mod pallet_timestamp;
pub mod pallet_vesting;
pub mod rocksdb_weights;
pub mod substrate_utility;
