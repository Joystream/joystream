#![no_main]
use libfuzzer_sys::fuzz_target;

use substrate_forum_module::mock::*;
//use mock::Test;
//pub mod mock;
//use crate::mock::*;

// run basic fuzzing via `cargo fuzz run fuzz_target_1 -- -max_len=256 -runs=10`

fuzz_target!(|data: &[u8]| {
    println!("fuzz &[u8]: {:?} ", data);
    // fuzzed code goes here
    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        println!("{:?}", TestForumModule::next_category_id());
    })
});
