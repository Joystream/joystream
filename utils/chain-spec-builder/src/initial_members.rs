use serde_json::Result;

use joystream_node::chain_spec::{membership, AccountId, Moment};
use sp_core::crypto::{AccountId32, Ss58Codec};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Member {
    pub member_id: u64,
    pub root_address: String,
    pub controller_address: String,
    pub handle: String,
    pub avatar_uri: String,
    pub about: String,
    pub registered_at_time: u64,
}

fn parse_members_json() -> Result<Vec<Member>> {
    let data = include_str!("../res/members_nicaea.json");
    serde_json::from_str(data)
}

fn decode_address(address: String) -> AccountId32 {
    AccountId32::from_ss58check(address.as_ref()).expect("failed to decode account id")
}

pub fn initial_members() -> Vec<membership::genesis::Member<u64, AccountId, Moment>> {
    let members = parse_members_json().expect("failed parsing members data");

    members
        .into_iter()
        .map(|member| membership::genesis::Member {
            member_id: member.member_id,
            root_account: decode_address(member.root_address.clone()),
            controller_account: decode_address(member.controller_address),
            handle: member.handle,
            avatar_uri: member.avatar_uri,
            about: member.about,
            registered_at_time: member.registered_at_time,
        })
        .collect()
}
