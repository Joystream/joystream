use codec::{Decode, Encode};
use frame_support::ensure;
use sp_std::vec::Vec;

#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct SealedVote<AccountId, Stake, Hash, Vote>
where
    Vote: Encode,
    Hash: PartialEq,
    AccountId: PartialEq,
{
    pub voter: AccountId,
    pub commitment: Hash, // 32 bytes - salted hash of serialized Vote
    pub stake: Stake,
    vote: Option<Vote>, // will be set when unsealing
}

impl<AccountId, Stake, Hash, Vote> SealedVote<AccountId, Stake, Hash, Vote>
where
    Vote: Encode,
    Hash: PartialEq,
    AccountId: PartialEq,
{
    pub fn new(
        voter: AccountId,
        stake: Stake,
        commitment: Hash,
    ) -> SealedVote<AccountId, Stake, Hash, Vote> {
        SealedVote {
            voter,
            commitment,
            stake,
            vote: None,
        }
    }

    pub fn new_unsealed(
        voter: AccountId,
        stake: Stake,
        commitment: Hash,
        vote: Vote,
    ) -> SealedVote<AccountId, Stake, Hash, Vote> {
        SealedVote {
            voter,
            commitment,
            stake,
            vote: Some(vote),
        }
    }

    pub fn unseal(
        &mut self,
        vote: Vote,
        salt: &mut Vec<u8>,
        hasher: fn(&[u8]) -> Hash,
    ) -> Result<(), &'static str> {
        // only unseal once
        ensure!(self.is_not_revealed(), "vote already unsealed");

        // seralize the vote and append the salt
        let mut payload = vote.encode();
        payload.append(salt);

        // hash the payload, if it matches the commitment it is a valid revealing of the vote
        if self.commitment == hasher(&payload) {
            self.vote = Some(vote);
            Ok(())
        } else {
            Err("invalid salt")
        }
    }

    pub fn get_vote(&self) -> &Option<Vote> {
        &self.vote
    }

    pub fn is_owned_by(&self, someone: AccountId) -> bool {
        someone == self.voter
    }

    pub fn is_revealed(&self) -> bool {
        self.vote.is_some()
    }

    pub fn is_not_revealed(&self) -> bool {
        self.vote.is_none()
    }
}
