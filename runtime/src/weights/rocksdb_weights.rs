//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-04-27 (Y/M/D)
//! HOSTNAME: `ip-172-31-3-111`, CPU: `Intel(R) Xeon(R) Platinum 8124M CPU @ 3.00GHz`
//!
//! DATABASE: `RocksDb`, RUNTIME: `Development`
//! BLOCK-NUM: `BlockId::Number(0)`
//! SKIP-WRITE: `false`, SKIP-READ: `false`, WARMUPS: `100`
//! STATE-VERSION: `V1`, STATE-CACHE-SIZE: ``
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
    use frame_support::weights::constants;
    use sp_core::parameter_types;
    use sp_weights::RuntimeDbWeight;

    parameter_types! {
        /// By default, Substrate uses `RocksDB`, so this will be the weight used throughout
        /// the runtime.
        pub const RocksDbWeight: RuntimeDbWeight = RuntimeDbWeight {
            /// Time to read one storage item.
            /// Calculated by multiplying the *Average* of all values with `1.0` and adding `0`.
            ///
            /// Stats nanoseconds:
            ///   Min, Max: 2_107, 402_151
            ///   Average:  6_130
            ///   Median:   3_650
            ///   Std-Dev:  31027.98
            ///
            /// Percentiles nanoseconds:
            ///   99th: 6_277
            ///   95th: 5_200
            ///   75th: 4_224
            read: 6_130 * constants::WEIGHT_REF_TIME_PER_NANOS,

            /// Time to write one storage item.
            /// Calculated by multiplying the *Average* of all values with `1.0` and adding `0`.
            ///
            /// Stats nanoseconds:
            ///   Min, Max: 12_814, 9_382_678
            ///   Average:  82_187
            ///   Median:   23_537
            ///   Std-Dev:  728541.68
            ///
            /// Percentiles nanoseconds:
            ///   99th: 124_856
            ///   95th: 36_498
            ///   75th: 28_349
            write: 82_187 * constants::WEIGHT_REF_TIME_PER_NANOS,
        };
    }

    #[cfg(test)]
    mod test_db_weights {
        use super::constants::RocksDbWeight as W;
        use sp_weights::constants;

        /// Checks that all weights exist and have sane values.
        // NOTE: If this test fails but you are sure that the generated values are fine,
        // you can delete it.
        #[test]
        fn bound() {
            // At least 1 µs.
            assert!(
                W::get().reads(1).ref_time() >= constants::WEIGHT_REF_TIME_PER_MICROS,
                "Read weight should be at least 1 µs."
            );
            assert!(
                W::get().writes(1).ref_time() >= constants::WEIGHT_REF_TIME_PER_MICROS,
                "Write weight should be at least 1 µs."
            );
            // At most 1 ms.
            assert!(
                W::get().reads(1).ref_time() <= constants::WEIGHT_REF_TIME_PER_MILLIS,
                "Read weight should be at most 1 ms."
            );
            assert!(
                W::get().writes(1).ref_time() <= constants::WEIGHT_REF_TIME_PER_MILLIS,
                "Write weight should be at most 1 ms."
            );
        }
    }
}
