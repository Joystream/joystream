#![no_main]
#![feature(fn_traits)]
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


        println!("{:?}", ReflectionTest {a: 1, b:2});



        // test function call with array of arguments
        create_category_mock.call((
            origin.clone(),
            None,
            texts.text[0].clone(),
            texts.text[1].clone(),
            Ok(()),
        ));

        TestForumModule::i_believe_i_can_fly();
        println!("{:?}", TestForumModule::i_believe_i_can_fly());
/*
        let a = vec![(
            origin.clone(),
            None,
            texts.text[0].clone(),
            texts.text[1].clone(),
            Ok(()),
        )];
        create_category_mock.call(a);
*/
    })
});

//use crate::*;
use substrate_forum_module_reflection::*;

//#[derive(FieldCount, Debug)]
#[derive(Debug)]
struct ReflectionTest {
    a: u64,
    b: u32,
}


type MyFunction = Fn(i32) -> i32;

//fn retrieve_module_endpoints<T: Fn(i32) -> i32>(module: Runtime) -> T {
fn retrieve_module_endpoints<T: Fn(i32) -> i32>(module: Runtime) -> () {
//fn retrieve_module_endpoints<T>(module: Runtime) -> T where T: MyFunction {
    //ReflectionTest::derive_field_count();

}

fn autowire_parameters_and_run<T: Fn(i32) -> i32>(function: T) -> () {

}
