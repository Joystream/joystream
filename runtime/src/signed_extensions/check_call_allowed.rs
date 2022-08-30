use crate::{AccountId, Balances, Call, Multisig, OriginCaller, Runtime};
use codec::{Decode, Encode};
use common::locks::STAKING_LOCK_ID;
use frame_support::{dispatch::RawOrigin, ensure, traits::LockIdentifier};
use frame_system::Config;
use scale_info::TypeInfo;
use sp_io::hashing::blake2_256;
use sp_runtime::{
    traits::{DispatchInfoOf, SignedExtension, TrailingZeroInput},
    transaction_validity::{InvalidTransaction, TransactionValidity, TransactionValidityError},
};
use sp_std::{vec, vec::Vec};
use staking_handler::LockComparator;

const BONDING_NOT_ALLOWED: u8 = 1;

#[derive(Encode, Decode, Clone, Eq, PartialEq, TypeInfo)]
#[scale_info(skip_type_params(T))]
pub struct CheckCallAllowed<T: Config + Send + Sync>(sp_std::marker::PhantomData<T>);

impl CheckCallAllowed<Runtime> {
    /// Create new `SignedExtension` to check allowed calls in transaction
    pub fn new() -> Self {
        Self(sp_std::marker::PhantomData)
    }
}

impl sp_std::fmt::Debug for CheckCallAllowed<Runtime> {
    #[cfg(feature = "std")]
    fn fmt(&self, f: &mut sp_std::fmt::Formatter) -> sp_std::fmt::Result {
        write!(f, "CheckCallAllowed")
    }

    #[cfg(not(feature = "std"))]
    fn fmt(&self, _: &mut sp_std::fmt::Formatter) -> sp_std::fmt::Result {
        Ok(())
    }
}

impl Default for CheckCallAllowed<Runtime> {
    fn default() -> Self {
        Self::new()
    }
}

impl CheckCallAllowed<Runtime> {
    // Checks to see if the account has any rivalrous locks that would conflict
    // with the FRAME staking pallet lock
    fn has_no_conflicting_locks(who: &AccountId) -> bool {
        let existing_locks = Balances::locks(who);

        if existing_locks.len() == 0 {
            return true;
        }

        if existing_locks.len() == 1 && existing_locks[0].id == STAKING_LOCK_ID {
            return true;
        }

        let existing_lock_ids: Vec<LockIdentifier> =
            existing_locks.iter().map(|lock| lock.id).collect();

        !Runtime::are_locks_conflicting(&STAKING_LOCK_ID, existing_lock_ids.as_slice())
    }

    // Recursively checks calls until one invalid bonding call is detected and returns false,
    // otherwise returns true.
    fn has_no_invalid_bonding_calls(who: &AccountId, calls: Vec<Call>) -> bool {
        for call in calls.into_iter() {
            let valid = match call {
                // Calls that can contain other Calls and must be checked recursively..
                Call::Utility(substrate_utility::Call::<Runtime>::batch { calls }) => {
                    Self::has_no_invalid_bonding_calls(who, calls.to_vec())
                }
                Call::Utility(substrate_utility::Call::<Runtime>::as_derivative {
                    call,
                    index,
                    ..
                }) => {
                    if let Some(who) = derivative_account_id(who, index) {
                        Self::has_no_invalid_bonding_calls(&who, vec![*call])
                    } else {
                        // decoding derivative account failed, let it be handled by utility pallet
                        true
                    }
                }
                Call::Multisig(pallet_multisig::Call::<Runtime>::as_multi {
                    call,
                    other_signatories,
                    threshold,
                    ..
                }) => {
                    let signatories = ensure_sorted_and_insert(other_signatories, who.clone()).ok();
                    if let Some(signatories) = signatories {
                        let id = Multisig::multi_account_id(&signatories, threshold);
                        // If the opaque call cannot be decoded we return true, it is not
                        // possible to process further.
                        call.try_decode().map_or(true, |decoded_call| {
                            Self::has_no_invalid_bonding_calls(&id, vec![decoded_call])
                        })
                    } else {
                        true
                    }
                }
                Call::Multisig(pallet_multisig::Call::<Runtime>::as_multi_threshold_1 {
                    call,
                    other_signatories,
                    ..
                }) => {
                    let signatories = ensure_sorted_and_insert(other_signatories, who.clone()).ok();
                    if let Some(signatories) = signatories {
                        let id = Multisig::multi_account_id(&signatories, 1);
                        Self::has_no_invalid_bonding_calls(&id, vec![*call])
                    } else {
                        true
                    }
                }

                // Calls that only root origin can invoke
                Call::Sudo(pallet_sudo::Call::<Runtime>::sudo { call }) => {
                    Self::has_no_invalid_bonding_calls(who, vec![*call])
                }
                Call::Sudo(pallet_sudo::Call::<Runtime>::sudo_as { who, call }) => {
                    // note local scoped `who` is what should be checked
                    Self::has_no_invalid_bonding_calls(&who, vec![*call])
                }
                Call::Sudo(pallet_sudo::Call::<Runtime>::sudo_unchecked_weight {
                    call, ..
                }) => Self::has_no_invalid_bonding_calls(who, vec![*call]),
                Call::Utility(substrate_utility::Call::<Runtime>::batch_all { calls }) => {
                    Self::has_no_invalid_bonding_calls(who, calls)
                }
                Call::Utility(substrate_utility::Call::<Runtime>::force_batch { calls }) => {
                    Self::has_no_invalid_bonding_calls(who, calls)
                }
                Call::Utility(substrate_utility::Call::<Runtime>::dispatch_as {
                    call,
                    as_origin,
                    ..
                }) => match *as_origin {
                    OriginCaller::system(origin) => match origin {
                        RawOrigin::Signed(signer) => {
                            Self::has_no_invalid_bonding_calls(&signer, vec![*call])
                        }
                        _ => Self::has_no_invalid_bonding_calls(who, vec![*call]),
                    },
                    OriginCaller::Void(_) => true,
                },

                // Bonding
                Call::Staking(pallet_staking::Call::<Runtime>::bond { .. }) => {
                    Self::has_no_conflicting_locks(who)
                }

                _ => true,
            };

            if !valid {
                return false;
            }
        }

        true
    }
}
impl SignedExtension for CheckCallAllowed<Runtime> {
    type AccountId = AccountId;
    type Call = Call;
    type AdditionalSigned = ();
    type Pre = ();
    const IDENTIFIER: &'static str = "CheckCallAllowed";

    fn additional_signed(&self) -> sp_std::result::Result<(), TransactionValidityError> {
        Ok(())
    }

    fn pre_dispatch(
        self,
        who: &Self::AccountId,
        call: &Self::Call,
        info: &DispatchInfoOf<Self::Call>,
        len: usize,
    ) -> Result<Self::Pre, TransactionValidityError> {
        self.validate(who, call, info, len).map(|_| ())
    }

    fn validate(
        &self,
        who: &Self::AccountId,
        call: &Self::Call,
        _info: &DispatchInfoOf<Self::Call>,
        _len: usize,
    ) -> TransactionValidity {
        if Self::has_no_invalid_bonding_calls(who, vec![call.clone()]) {
            Ok(Default::default())
        } else {
            InvalidTransaction::Custom(BONDING_NOT_ALLOWED).into()
        }
    }
}

// Helper function from multisig pallet
fn ensure_sorted_and_insert(
    other_signatories: Vec<AccountId>,
    who: AccountId,
) -> Result<Vec<AccountId>, pallet_multisig::Error<Runtime>> {
    let mut signatories = other_signatories;
    let mut maybe_last = None;
    let mut index = 0;
    for item in signatories.iter() {
        if let Some(last) = maybe_last {
            ensure!(
                last < item,
                pallet_multisig::Error::<Runtime>::SignatoriesOutOfOrder
            );
        }
        if item <= &who {
            ensure!(
                item != &who,
                pallet_multisig::Error::<Runtime>::SenderInSignatories
            );
            index += 1;
        }
        maybe_last = Some(item);
    }
    signatories.insert(index, who);
    Ok(signatories)
}

/// Derive a derivative account ID from the owner account and the sub-account index.
pub fn derivative_account_id(who: &AccountId, index: u16) -> Option<AccountId> {
    let entropy = (b"modlpy/utilisuba", who, index).using_encoded(blake2_256);
    Decode::decode(&mut TrailingZeroInput::new(entropy.as_ref())).ok()
}
