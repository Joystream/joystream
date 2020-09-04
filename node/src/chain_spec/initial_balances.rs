use codec::Decode;
use node_runtime::{AccountId, Balance};
use serde::Deserialize;
use std::{fs, path::Path};

#[derive(Decode)]
struct InitialBalances {
    balances: Vec<(AccountId, Balance)>,
}

#[derive(Deserialize)]
struct EncodedInitialBalances {
    balances: Vec<(String, String)>,
}

impl EncodedInitialBalances {
    fn decode(&self) -> InitialBalances {
        InitialBalances {
            balances: self
                .balances
                .iter()
                .map(|(account, balance)| {
                    let encoded_account = hex::decode(&account[2..].as_bytes())
                        .expect("failed to parse account id hex string");
                    let encoded_balance = hex::decode(&balance[2..].as_bytes())
                        .expect("failed to parse balance hex string");
                    (
                        Decode::decode(&mut encoded_account.as_slice()).unwrap(),
                        Decode::decode(&mut encoded_balance.as_slice()).unwrap(),
                    )
                })
                .collect(),
        }
    }
}

fn parse_forum_json(data_file: &Path) -> EncodedInitialBalances {
    let data = fs::read_to_string(data_file).expect("Failed reading file");
    serde_json::from_str(&data).expect("failed parsing balances data")
}

/// Deserializes and Decodes initial balances from json file
pub fn from_json(data_file: &Path) -> Vec<(AccountId, Balance)> {
    let encoded = parse_forum_json(data_file);
    let decoded = encoded.decode();
    decoded.balances
}
