#![no_main]
use libfuzzer_sys::fuzz_target;

use substrate_forum_module::mock::*;

use libfuzzer_sys::arbitrary::Arbitrary;
#[derive(Debug, Arbitrary)]
pub struct Texts {
    text: [Vec<u8>; 2],
}

fuzz_target!(|texts: Texts| {

    println!("fuzz: {:?} ", 64);
    println!("fuzz: {:?} ", texts);
    // fuzzed code goes here
    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        println!("{:?}", TestForumModule::next_category_id());

        println!("starting category mock");

        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        create_category_mock(
            origin.clone(),
            None,
            texts.text[0].clone(),
            texts.text[1].clone(),
            Ok(()),
        );

        println!("category mock finished");
    })
});
