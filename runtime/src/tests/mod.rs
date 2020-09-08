//! The Joystream Substrate Node runtime integration tests.

#![cfg(test)]

mod proposals_integration;
mod storage_integration;

pub(crate) fn initial_test_ext() -> sp_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<crate::Runtime>()
        .unwrap();

    t.into()
}
