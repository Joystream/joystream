#![cfg(test)]

use super::*;
use crate::mock::*;

/////////////////// Lifetime - referendum start ////////////////////////////////
#[test]
fn referendum_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);

        mock_start_referendum(origin, Ok(()));
    });
}

#[test]
fn referendum_start_access_restricted() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_REGULAR);

        mock_start_referendum(origin, Err(Error::OriginNotSuperUser));
    });
}

#[test]
fn referendum_start_forbidden_after_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);

        mock_start_referendum(origin.clone(), Ok(()));
        mock_start_referendum(origin.clone(), Err(Error::ReferendumAlreadyRunning));
    });
}

/////////////////// Lifetime - voting finish ///////////////////////////////////

#[test]
#[ignore]
fn finish_voting() {}

/////////////////// Lifetime - start revealing /////////////////////////////////

#[test]
#[ignore]
fn finish_revealing_period() {}

/////////////////// Lifetime - complete ////////////////////////////////////////

#[test]
#[ignore]
fn referendum_whole_process() {}
