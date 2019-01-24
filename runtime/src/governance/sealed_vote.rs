#![cfg_attr(not(feature = "std"), no_std)]

extern crate sr_std;
#[cfg(test)]
extern crate sr_io;
#[cfg(test)]
extern crate substrate_primitives as primitives;
extern crate sr_primitives;
#[cfg(feature = "std")]
extern crate parity_codec;
use parity_codec::Encode;

use srml_support::dispatch::Vec;

#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct SealedVote<AccountId, Stake, Hash, Vote> 
    where Vote: Encode, Hash: PartialEq, AccountId: PartialEq
{
  voter: AccountId,
  commitment: Hash, // 32 bytes - salted hash of serialized Vote
  stake: Stake,
  vote: Option<Vote>, // will be set when unsealing
}

impl<AccountId, Stake, Hash, Vote> SealedVote<AccountId, Stake, Hash, Vote>    
    where Vote: Encode, Hash: PartialEq, AccountId: PartialEq
{
    pub fn new(voter: AccountId, stake: Stake, commitment: Hash) -> SealedVote<AccountId, Stake, Hash, Vote> {
        SealedVote {
            voter,
            commitment,
            stake,
            vote: None,
        }
    }

    pub fn unseal(&mut self, vote: Vote, salt: &mut Vec<u8>, hasher: fn(&[u8]) -> Hash) -> Result<bool, &'static str> {
        // only unseal once
        if self.vote.is_some() {
            return Err("vote already unsealed");
        }

        // seralize the vote and append the salt
        let mut payload = vote.encode();
        payload.append(salt);

        // hash the payload, if it matches the commitment it is a valid revealing of the vote
        self.vote = match self.commitment ==  hasher(&payload) {
            true => Some(vote),
            false => None,
        };

        Ok(self.vote.is_some())
    }

    pub fn get_vote(&self) -> &Option<Vote> {
        &self.vote
    }

    pub fn owned_by(&self, someone: AccountId) -> bool {
        someone == self.voter
    }
}