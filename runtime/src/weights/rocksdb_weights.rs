//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-11-06 (Y/M/D)
//! HOSTNAME: `ip-172-31-43-193`, CPU: `Intel(R) Xeon(R) Platinum 8375C CPU @ 2.90GHz`
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
            ///   Min, Max: 1_696, 336_369
            ///   Average:  4_968
            ///   Median:   2_991
            ///   Std-Dev:  25574.72
            ///
            /// Percentiles nanoseconds:
            ///   99th: 5_278
            ///   95th: 4_072
            ///   75th: 3_355
            read: 4_968 * constants::WEIGHT_REF_TIME_PER_NANOS,

            /// Time to write one storage item.
            /// Calculated by multiplying the *Average* of all values with `1.0` and adding `0`.
            ///
            /// Stats nanoseconds:
            ///   Min, Max: 9_954, 7_566_780
            ///   Average:  64_373
            ///   Median:   19_318
            ///   Std-Dev:  578848.27
            ///
            /// Percentiles nanoseconds:
            ///   99th: 57_547
            ///   95th: 28_325
            ///   75th: 22_513
            write: 64_373 * constants::WEIGHT_REF_TIME_PER_NANOS,
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
