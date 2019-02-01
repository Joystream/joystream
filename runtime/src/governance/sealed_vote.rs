#![cfg_attr(not(feature = "std"), no_std)]

use parity_codec::Encode;
use srml_support::dispatch::Vec;

#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct SealedVote<AccountId, Stake, Hash, Vote>
    where Vote: Encode, Hash: PartialEq, AccountId: PartialEq
{
  pub voter: AccountId,
  pub commitment: Hash, // 32 bytes - salted hash of serialized Vote
  pub stake: Stake,
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

    pub fn new_unsealed(voter: AccountId, stake: Stake, commitment: Hash, vote: Vote) -> SealedVote<AccountId, Stake, Hash, Vote> {
        SealedVote {
            voter,
            commitment,
            stake,
            vote: Some(vote),
        }
    }

    pub fn unseal(&mut self, vote: Vote, salt: &mut Vec<u8>, hasher: fn(&[u8]) -> Hash) -> Result<bool, &'static str> {
        // only unseal once
        if self.was_revealed() {
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

        Ok(self.was_revealed())
    }

    pub fn get_vote(&self) -> &Option<Vote> {
        &self.vote
    }

    pub fn owned_by(&self, someone: AccountId) -> bool {
        someone == self.voter
    }

    pub fn was_revealed(&self) -> bool {
        self.vote.is_some()
    }
}