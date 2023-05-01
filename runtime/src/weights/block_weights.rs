//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-04-27 (Y/M/D)
//! HOSTNAME: `ip-172-31-3-111`, CPU: `Intel(R) Xeon(R) Platinum 8124M CPU @ 3.00GHz`
//!
//! SHORT-NAME: `block`, LONG-NAME: `BlockExecution`, RUNTIME: `Development`
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
    /// Time to execute an empty block.
    /// Calculated by multiplying the *Average* with `1.0` and adding `0`.
    ///
    /// Stats nanoseconds:
    ///   Min, Max: 546_742, 599_177
    ///   Average:  558_311
    ///   Median:   553_503
    ///   Std-Dev:  11462.26
    ///
    /// Percentiles nanoseconds:
    ///   99th: 590_212
    ///   95th: 583_232
    ///   75th: 563_450
    pub const BlockExecutionWeight: Weight =
        Weight::from_ref_time(WEIGHT_REF_TIME_PER_NANOS.saturating_mul(558_311));
}

#[cfg(test)]
mod test_weights {
    use sp_weights::constants;

    /// Checks that the weight exists and is sane.
    // NOTE: If this test fails but you are sure that the generated values are fine,
    // you can delete it.
    #[test]
    fn sane() {
        let w = super::BlockExecutionWeight::get();

        // At least 100 µs.
        assert!(
            w.ref_time() >= 100u64 * constants::WEIGHT_REF_TIME_PER_MICROS,
            "Weight should be at least 100 µs."
        );
        // At most 50 ms.
        assert!(
            w.ref_time() <= 50u64 * constants::WEIGHT_REF_TIME_PER_MILLIS,
            "Weight should be at most 50 ms."
        );
    }
}
