//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-07-31 (Y/M/D)
//! HOSTNAME: `Mokhtars-MacBook-Pro.local`, CPU: `<UNKNOWN>`
//!
//! DATABASE: `RocksDb`, RUNTIME: `Development`
//! BLOCK-NUM: `BlockId::Number(0)`
//! SKIP-WRITE: `false`, SKIP-READ: `false`, WARMUPS: `100`
//! STATE-VERSION: `V1`, STATE-CACHE-SIZE: ``
//! WEIGHT-PATH: `./../runtime/src/weights/`
//! METRIC: `Average`, WEIGHT-MUL: `1.0`, WEIGHT-ADD: `0`

// Executed Command:
//   ./../target/release/joystream-node
//   benchmark
//   storage
//   --chain=prod-test
//   --warmups=100
//   --weight-path=./../runtime/src/weights/
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
            ///   Min, Max: 1_333, 129_041
            ///   Average:  3_499
            ///   Median:   2_666
            ///   Std-Dev:  9857.21
            ///
            /// Percentiles nanoseconds:
            ///   99th: 4_833
            ///   95th: 4_041
            ///   75th: 3_166
            read: 3_499 * constants::WEIGHT_REF_TIME_PER_NANOS,

            /// Time to write one storage item.
            /// Calculated by multiplying the *Average* of all values with `1.0` and adding `0`.
            ///
            /// Stats nanoseconds:
            ///   Min, Max: 9_208, 2_688_500
            ///   Average:  33_700
            ///   Median:   17_208
            ///   Std-Dev:  207994.77
            ///
            /// Percentiles nanoseconds:
            ///   99th: 42_750
            ///   95th: 26_041
            ///   75th: 20_125
            write: 33_700 * constants::WEIGHT_REF_TIME_PER_NANOS,
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
