use node_runtime::{constants::currency, AccountId, Balance, BlockNumber};
use serde::Deserialize;
use std::{fs, path::Path};

#[derive(Deserialize)]
struct SerializedInitialBalances {
    // (who, total balance)
    balances: Vec<(AccountId, Balance)>,
    // (who, begin, length, liquid)
    vesting: Vec<(AccountId, BlockNumber, BlockNumber, Balance)>,
}

fn parse_json(data_file: &Path) -> SerializedInitialBalances {
    let data = fs::read_to_string(data_file).expect("Failed reading file");
    serde_json::from_str(&data).expect("failed parsing balances data")
}

/// Deserializes initial balances from json file
pub fn balances_from_json(data_file: &Path) -> Vec<(AccountId, Balance)> {
    parse_json(data_file)
        .balances
        .into_iter()
        .map(|(account, balance)| (account, balance.saturating_mul(currency::BASE_UNIT_PER_JOY)))
        .collect()
}

/// Deserializes initial vesting config from json file
pub fn vesting_from_json(data_file: &Path) -> Vec<(AccountId, BlockNumber, BlockNumber, Balance)> {
    parse_json(data_file)
        .vesting
        .into_iter()
        .map(|(account, begin, length, liquid)| {
            (
                account,
                begin,
                length,
                liquid.saturating_mul(currency::BASE_UNIT_PER_JOY),
            )
        })
        .collect()
}
