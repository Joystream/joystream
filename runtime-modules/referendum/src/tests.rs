#![cfg(test)]

//use super::*;
use crate::mock::*;

#[test]
fn referendum_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);

        mock_start_referendum(origin, Ok(()));
    });
}

#[test]
#[ignore]
fn finish_voting() {}

#[test]
#[ignore]
fn finish_revealing_period() {}

#[test]
#[ignore]
fn referendum_whole_process() {}
