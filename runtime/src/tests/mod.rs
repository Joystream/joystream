//! The Joystream Substrate Node runtime integration tests.

#![cfg(test)]

mod proposals_integration;
mod storage_integration;
use sp_runtime::BuildStorage;

pub(crate) fn initial_test_ext() -> sp_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<crate::Runtime>()
        .unwrap();

    // build the council config to initialize the mint
    let council_config = governance::council::GenesisConfig::<crate::Runtime>::default()
        .build_storage()
        .unwrap();

    council_config.assimilate_storage(&mut t).unwrap();

    t.into()
}
