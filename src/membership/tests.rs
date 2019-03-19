#![cfg(test)]

use super::*;
use super::mock::*;

use parity_codec::Encode;
use runtime_io::with_externalities;
use srml_support::*;

#[test]
fn test_setup() {
    with_externalities(&mut initial_test_ext(), || {
        assert!(false);
    });
}