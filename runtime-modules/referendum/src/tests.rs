#![cfg(test)]

use super::{Error, Trait};
use crate::mock::*;

type Mocks = InstanceMocks<Runtime, Instance0>;

/////////////////// Lifetime - referendum start ////////////////////////////////
#[test]
fn referendum_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];

        Mocks::start_referendum(origin, options, Ok(()));
    });
}

#[test]
fn referendum_start_access_restricted() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_REGULAR);
        let options = vec![0];

        Mocks::start_referendum(origin, options, Err(Error::OriginNotSuperUser));
    });
}

#[test]
fn referendum_start_forbidden_after_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];

        Mocks::start_referendum(origin.clone(), options.clone(), Ok(()));
        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            Err(Error::ReferendumAlreadyRunning),
        );
    });
}

#[test]
fn referendum_start_no_options() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![];

        Mocks::start_referendum(origin.clone(), options, Err(Error::NoReferendumOptions));
    });
}

#[test]
fn referendum_start_too_many_options() {
    let origin = OriginType::Signed(USER_ADMIN);

    let too_many_options: Vec<u64> =
        (0..(<Runtime as Trait<Instance0>>::MaxReferendumOptions::get() + 1)).collect();
    let ok_options = too_many_options.as_slice()[..too_many_options.len() - 1].to_vec();

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        Mocks::start_referendum(origin.clone(), ok_options, Ok(()));
    });

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        Mocks::start_referendum(
            origin.clone(),
            too_many_options,
            Err(Error::TooManyReferendumOptions),
        );
    });
}

#[test]
fn referendum_start_not_unique_options() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0, 1, 2, 2, 3];

        Mocks::start_referendum(
            origin.clone(),
            options,
            Err(Error::DuplicateReferendumOptions),
        );
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
