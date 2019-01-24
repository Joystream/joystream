#![cfg_attr(not(feature = "std"), no_std)]

extern crate sr_std;
#[cfg(test)]
extern crate sr_io;
#[cfg(test)]
extern crate substrate_primitives as primitives;
extern crate sr_primitives;
#[cfg(feature = "std")]
extern crate parity_codec as codec;

// commitment of a sealed vote is calculated over this structure
#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct Vote<Payload, Salt> {
    payload: Payload,
    salt: Salt  // 32 bytes - secret which seals the payload
}

#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct SealedVote<AccountId, Stake, Payload, Hash, Salt> {
  voter: AccountId,
  commitment: Hash, // 32 bytes - SHA256 hash of payload
  stake: Stake,
  vote: Option<Vote<Payload, Salt>>,
}

impl<AccountId, Stake, Payload, Hash, Salt> SealedVote<AccountId, Stake, Payload, Hash, Salt> {
    pub fn new(voter: AccountId, commitment: Hash, stake: Stake) -> SealedVote<AccountId, Stake, Payload, Hash, Salt> {
        SealedVote {
            voter,
            commitment,
            stake,
            vote: None,
        }
    }

    pub fn unseal(&self, vote: Vote<Payload, Salt>) -> bool {

        false
    }

    pub fn unsealed(&self) -> bool {
        self.vote.is_some()
    }
}