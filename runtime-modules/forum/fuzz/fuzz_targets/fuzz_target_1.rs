#![no_main]
use libfuzzer_sys::fuzz_target;

// run basic fuzzing via `cargo fuzz run fuzz_target_1 -- -max_len=256 -runs=10`

fuzz_target!(|data: &[u8]| {
    println!("fuzz &[u8]: {:?} ", data);
    // fuzzed code goes here
});
