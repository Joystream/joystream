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

//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-01-09 (Y/M/D)
//!
//! DATABASE: `RocksDb`, RUNTIME: `Development`
//! BLOCK-NUM: `BlockId::Number(0)`
//! SKIP-WRITE: `false`, SKIP-READ: `false`, WARMUPS: `100`
//! STATE-VERSION: `V1`, STATE-CACHE-SIZE: `0`
//! WEIGHT-PATH: `./scripts/../runtime/src/weights/`
//! METRIC: `Average`, WEIGHT-MUL: `1.0`, WEIGHT-ADD: `0`

// Executed Command:
//   ./scripts/../target/release/joystream-node
//   benchmark
//   storage
//   --chain=prod-test
//   --warmups=100
//   --weight-path=./scripts/../runtime/src/weights/
//   --state-version
//   1

/// Storage DB weights for the `Development` runtime and `RocksDb`.
pub mod constants {
    use frame_support::{
        parameter_types,
        weights::{constants, RuntimeDbWeight},
    };

    parameter_types! {
        /// By default, Substrate uses `RocksDB`, so this will be the weight used throughout
        /// the runtime.
        pub const RocksDbWeight: RuntimeDbWeight = RuntimeDbWeight {
            /// Time to read one storage item.
            /// Calculated by multiplying the *Average* of all values with `1.0` and adding `0`.
            ///
            /// Stats nanoseconds:
            ///   Min, Max: 3_460, 308_156
            ///   Average:  6_914
            ///   Median:   4_967
            ///   Std-Dev:  23393.73
            ///
            /// Percentiles nanoseconds:
            ///   99th: 9_096
            ///   95th: 6_416
            ///   75th: 5_576
            read: 6_914 * constants::WEIGHT_PER_NANOS,

            /// Time to write one storage item.
            /// Calculated by multiplying the *Average* of all values with `1.0` and adding `0`.
            ///
            /// Stats nanoseconds:
            ///   Min, Max: 9_853, 4_385_963
            ///   Average:  45_834
            ///   Median:   19_379
            ///   Std-Dev:  336902.58
            ///
            /// Percentiles nanoseconds:
            ///   99th: 52_660
            ///   95th: 27_474
            ///   75th: 22_907
            write: 45_834 * constants::WEIGHT_PER_NANOS,
        };
    }

    #[cfg(test)]
    mod test_db_weights {
        use super::constants::RocksDbWeight as W;
        use frame_support::weights::constants;

        /// Checks that all weights exist and have sane values.
        // NOTE: If this test fails but you are sure that the generated values are fine,
        // you can delete it.
        #[test]
        fn bound() {
            // At least 1 µs.
            assert!(
                W::get().reads(1) >= constants::WEIGHT_PER_MICROS,
                "Read weight should be at least 1 µs."
            );
            assert!(
                W::get().writes(1) >= constants::WEIGHT_PER_MICROS,
                "Write weight should be at least 1 µs."
            );
            // At most 1 ms.
            assert!(
                W::get().reads(1) <= constants::WEIGHT_PER_MILLIS,
                "Read weight should be at most 1 ms."
            );
            assert!(
                W::get().writes(1) <= constants::WEIGHT_PER_MILLIS,
                "Write weight should be at most 1 ms."
            );
        }
    }
}
