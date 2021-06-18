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

// FRAME pallets
pub mod frame_system;
pub mod pallet_balances;
pub mod pallet_session;
pub mod pallet_staking;
pub mod pallet_timestamp;
pub mod substrate_utility;

// Joystream pallets
pub mod blog;
pub mod bounty;
pub mod council;
pub mod forum;
pub mod joystream_utility;
pub mod membership;
pub mod pallet_constitution;
pub mod proposals_codex;
pub mod proposals_discussion;
pub mod proposals_engine;
pub mod referendum;
pub mod working_group;
