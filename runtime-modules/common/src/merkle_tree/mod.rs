use codec::{Decode, Encode};
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

pub mod helpers;

/// Side used to construct hash values during merkle proof verification
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug, TypeInfo)]
pub enum Side {
    Left,
    Right,
}

impl Default for Side {
    fn default() -> Self {
        Side::Right
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, TypeInfo)]
/// Element used in for channel payout
pub struct ProofElementRecord<Hash, Side> {
    // Node hash
    pub hash: Hash,
    // side in which *self* must be adjoined during proof verification
    pub side: Side,
}
