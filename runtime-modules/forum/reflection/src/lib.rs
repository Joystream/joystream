extern crate proc_macro;
use proc_macro::TokenStream;

use syn::{parse_macro_input, ItemStruct};

#[proc_macro_derive(FieldCount)]
pub fn derive_field_count(input: TokenStream) -> TokenStream {
    /*
    let tmp_input = parse_macro_input!(input as ItemStruct);

    let field_count = input.fields.iter().count();

    //field_count
    input
    */

    println!("{:?}", input);

    let tmp_input = parse_macro_input!(input as ItemStruct);
println!("{:?}", tmp_input);
/*
    println!("print one by one");

    println!("{:?}", tmp_input.fields.iter().next());
    //tmp_input.fields.iter().map(|a| println!("-------- {:?}", a));
    tmp_input.fields.iter().map(|a| {println!("-------- {:?}", a)});
    println!("print done");
*/
    //input
    TokenStream::new()
}
