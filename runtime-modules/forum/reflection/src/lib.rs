extern crate proc_macro;
use proc_macro::TokenStream;

use syn::{parse_macro_input, ItemStruct, ItemEnum, Fields, Type};

mod extract_module_functions;
//use extract_module_functions
//use crate::extract_module_functions::*;

#[proc_macro_derive(FuzzyModule)]
pub fn derive_field_count(input: TokenStream) -> TokenStream {
    /*
    let tmp_input = parse_macro_input!(input as ItemStruct);

    let field_count = input.fields.iter().count();

    //field_count
    input
    */

//return input;

    //println!("iiiinput {:?}", input);
println!("xxx");
    //let tmp_input = parse_macro_input!(input as ItemStruct);
    let tmp_input = parse_macro_input!(input as ItemEnum);
println!("xxx");



println!("---------");
/*
// various debug prints follows
/*
println!("attrs {:?}", tmp_input.attrs);
println!("---------");
println!("vis {:?}", tmp_input.vis);
println!("---------");
println!("enum_token {:?}", tmp_input.enum_token);
println!("---------");
println!("ident {:?}", tmp_input.ident);
println!("---------");
println!("generics {:?}", tmp_input.generics);
println!("---------");
println!("brace_token {:?}", tmp_input.brace_token);
println!("---------");
*/
//println!("variants {:?}", tmp_input);
//return TokenStream::new();
/*
tmp_input.variants.iter().map(|a| {println!("-------- {:?}", a)});

let len = tmp_input.variants.len();
for i in 0..len {
    println!("{} ----- {:?}", i, tmp_input.variants[i]);
}
*/
//tmp_input.variants.iter().map(|a| {println!("-------- {:?}", a); ()}).collect::<()>();
tmp_input.variants.iter().map(|a| println!("-------- {:?}", a)).collect::<()>();

println!("variant attrs {:?}", tmp_input.variants[1].attrs);
println!("variant ident {:?}", tmp_input.variants[1].ident);
println!("variant fields {:?}", tmp_input.variants[1].fields);
println!("variant discriminant {:?}", tmp_input.variants[1].discriminant);

println!("---------");

/*
let len = tmp_input.variants[1].attrs.len();
for i in 0..len {
    println!("{:?}", tmp_input.variants[1].attrs);
}
*/
match &tmp_input.variants[1].fields {
    Fields::Unnamed(unnamed_fields) => {
        println!("{:?}", unnamed_fields);

        let len = unnamed_fields.unnamed.len();
        for i in 0..len {
            //println!("{:?}", unnamed_fields.unnamed[i]);
            println!("{:?}", unnamed_fields.unnamed[i].ty);

            match &unnamed_fields.unnamed[i].ty {
                Type::Path(type_path) => {
                    println!("{:?}", type_path.path.segments[0].ident.to_string());
                },
                _ => panic!("not implemented"),
            }
        }
    },
    _ => panic!("not implemented"),
}




    // some usefull prints
    println!("found module methods:");
    let len = tmp_input.variants.len();
    for i in 0..len {
        println!("{:?}", tmp_input.variants[i].ident);
    }

*/


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
