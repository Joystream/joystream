#![cfg(test)]

/// Imports all the definitions from the outer scope so we can use them here.
//use super::*;
use crate::content_directorddy::*;

/// We test if the default constructor does its job.
#[test]
fn default_works() {
    // Note that even though we defined our `#[ink(constructor)]`
    // above as `&mut self` functions that return nothing we can call
    // them in test code as if they were normal Rust constructors
    // that take no `self` argument but return `Self`.
    let content_directory = ContentDirectory::default();
    assert_eq!(content_directory.get(), false);
}

/// We test a simple use case of our contract.
#[test]
fn it_works() {
    let mut content_directory = ContentDirectory::new(false);
    assert_eq!(content_directory.get(), false);
    content_directory.flip();
    assert_eq!(content_directory.get(), true);
}