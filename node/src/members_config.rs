use serde::Deserialize;
use serde_json::Result;

use sp_core::crypto::{AccountId32, Ss58Codec};

#[derive(Deserialize)]
struct Member {
    /// SS58 Encoded public key
    address: String,
    handle: String,
    avatar_uri: String,
    about: String,
}

fn parse_members_json() -> Result<Vec<Member>> {
    let data = include_str!("../res/acropolis_members.json");
    serde_json::from_str(data)
}

pub fn decode_address(address: String) -> AccountId32 {
    AccountId32::from_ss58check(address.as_ref()).expect("failed to decode account id")
}

pub fn initial_members() -> Vec<(AccountId32, String, String, String)> {
    let members = parse_members_json().expect("failed parsing members data");

    members
        .into_iter()
        .map(|member| {
            (
                decode_address(member.address),
                member.handle,
                member.avatar_uri,
                member.about,
            )
        })
        .collect()
}
