//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-04-27 (Y/M/D)
//! HOSTNAME: `ip-172-31-3-111`, CPU: `Intel(R) Xeon(R) Platinum 8124M CPU @ 3.00GHz`
//!
//! SHORT-NAME: `extrinsic`, LONG-NAME: `ExtrinsicBase`, RUNTIME: `Development`
//! WARMUPS: `10`, REPEAT: `100`
//! WEIGHT-PATH: `./scripts/../runtime/src/weights`
//! WEIGHT-METRIC: `Average`, WEIGHT-MUL: `1.0`, WEIGHT-ADD: `0`

// Executed Command:
//   ./scripts/../target/release/joystream-node
//   benchmark
//   overhead
//   --chain=prod-test
//   --execution=wasm
//   --warmup=10
//   --repeat=100
//   --weight-path=./scripts/../runtime/src/weights

use sp_core::parameter_types;
use sp_weights::{constants::WEIGHT_REF_TIME_PER_NANOS, Weight};

parameter_types! {
    /// Time to execute a NO-OP extrinsic, for example `System::remark`.
    /// Calculated by multiplying the *Average* with `1.0` and adding `0`.
    ///
    /// Stats nanoseconds:
    ///   Min, Max: 131_166, 134_219
    ///   Average:  132_220
    ///   Median:   132_065
    ///   Std-Dev:  591.09
    ///
    /// Percentiles nanoseconds:
    ///   99th: 133_738
    ///   95th: 133_375
    ///   75th: 132_459
    pub const ExtrinsicBaseWeight: Weight =
        Weight::from_ref_time(WEIGHT_REF_TIME_PER_NANOS.saturating_mul(132_220));
}

#[cfg(test)]
mod test_weights {
    use sp_weights::constants;

    /// Checks that the weight exists and is sane.
    // NOTE: If this test fails but you are sure that the generated values are fine,
    // you can delete it.
    #[test]
    fn sane() {
        let w = super::ExtrinsicBaseWeight::get();

        // At least 10 µs.
        assert!(
            w.ref_time() >= 10u64 * constants::WEIGHT_REF_TIME_PER_MICROS,
            "Weight should be at least 10 µs."
        );
        // At most 1 ms.
        assert!(
            w.ref_time() <= constants::WEIGHT_REF_TIME_PER_MILLIS,
            "Weight should be at most 1 ms."
        );
    }
}
