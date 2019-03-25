#![cfg(test)]

use super::*;
use super::mock::*;

use parity_codec::Encode;
use runtime_io::with_externalities;
use srml_support::*;

#[test]
fn initial_state()
{
    const DEFAULT_FIRST_ID: u64 = 1000;

    with_externalities(&mut ExtBuilder::default()
        .first_data_object_type_id(DEFAULT_FIRST_ID).build(), ||
    {
        assert_eq!(Types::first_data_object_type_id(), DEFAULT_FIRST_ID);

        // TODO

        assert_ok!(Err(123));
    });
}
