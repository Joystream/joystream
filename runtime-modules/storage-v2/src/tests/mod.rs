#![cfg(test)]

mod mock;

use mock::{initial_test_ext, Storage};

#[test]
fn test() {
    initial_test_ext().execute_with(|| {
        assert_eq!(Storage::council_bag(), Default::default());
    });
}
