#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

use crate::primitives::AccountId;
use codec::{Decode, Encode};
use sp_runtime::traits::Verify;
use sp_runtime::MultiSignature;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct GatewaySignature(MultiSignature);
impl gateway::Verify<AccountId> for GatewaySignature {
    fn verify(&self, msg: &[u8], signer: &AccountId) -> bool {
        self.0.verify(msg, signer)
    }
}
