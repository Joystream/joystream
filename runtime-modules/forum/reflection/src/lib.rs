extern crate proc_macro;
use proc_macro::TokenStream;

use syn::{parse_macro_input, ItemStruct, ItemEnum, Fields, Type};

mod extract_module_functions;
//use extract_module_functions
//use crate::extract_module_functions::*;

#[proc_macro_derive(FuzzyModule)]
pub fn derive_fuzzy_module(input: TokenStream) -> TokenStream {
    let tmp_input = parse_macro_input!(input as ItemEnum);

    println!("-----------------xxxxxxxxxxx-------------");
    let tmp = extract_module_functions::extract_module_functions(&tmp_input);
    println!("hello {:?}", tmp);


//println!("------- {:?}", tmp_input);
/*
    println!("print one by one");

    println!("{:?}", tmp_input.fields.iter().next());
    //tmp_input.fields.iter().map(|a| println!("-------- {:?}", a));
    tmp_input.fields.iter().map(|a| {println!("-------- {:?}", a)});
    println!("print done");
*/
    //input
    TokenStream::new()
    //input
}
