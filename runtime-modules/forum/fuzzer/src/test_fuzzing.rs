//#![cfg(test)]
//#![cfg_attr(feature = "fuzzy_test", test)]

use honggfuzz::fuzz;
//use mock::*;
//use mock::TestForumModule;
//mod mock;
//mod mock;



//#[cfg(fuzzing)]
use substrate_forum_module::mock::*;
//use crate::mock::*;

// HFUZZ_RUN_ARGS="-n 8" cargo hfuzz run test_fuzzing
/*
println!("fuzz &[u8]: {:?} ", data);
// fuzzed code goes here
println!("{:?}", TestForumModule::next_category_id());

*/
fn main() {
    println!("Starting fuzzer");
    loop {
        fuzz!(|data: &[u8]| {
            println!("{:?}", data);

//            let config = default_genesis_config();
            let forum_lead = FORUM_LEAD_ORIGIN_ID;
            let origin = OriginType::Signed(forum_lead);

            create_category_mock(
                origin,
                None,
                b"adsfqwer".to_vec(),
                b"vcbcvbcv".to_vec(),
                //Err(Error::OriginNotForumLead)
                Ok(()),
            );

            //panic!("AAAAAAAAAAAAAAAAAAA");
        })
    }
}
