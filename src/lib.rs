// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Decode, Encode};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, StorageMap, StorageValue,
};

use minting::{self, BalanceOf, MintId};
use system;

/// Type of identifier for recipients.
type RecipientId = u64;

/// Type for identifier for relationship representing that a recipient recieves recurring reward from a token mint
type RewardRelationshipId = u64;

pub trait Trait: system::Trait + minting::Trait + Sized {
    type PayoutStatusHandler: PayoutStatusHandler<Self>;
}

/// Handler for aftermath of a payout attempt
pub trait PayoutStatusHandler<T: Trait> {
    fn payout_status(
        id: RewardRelationshipId,
        status: bool,
        destination_account: T::AccountId,
        amount: BalanceOf<T>,
    );
}

// A recipient of recurring rewards
pub struct Recipient<T: Trait> {
    /// stats
    // Total payout received by this recipient
    total_reward_received: BalanceOf<T>,

    // Total payout missed for this recipient
    total_reward_missed: BalanceOf<T>,
}

pub struct RewardRelationship<T: Trait> {
    // Identifier for receiver
    recipient: RecipientId,

    // Identifier for reward source
    mint_id: MintId,

    // Destination account for reward
    account: T::AccountId,

    // Paid out for
    amount_per_payout: BalanceOf<T>,

    // When set, identifies block when next payout should be processed,
    // otherwise there is no pending payout
    next_payment_in_block: Option<T::BlockNumber>,

    // When set, will be the basis for automatically setting next payment,
    // otherwise any upcoming payout will be a one off.
    payout_interval: Option<T::BlockNumber>,

    /// stats
    // Total payout received in this relationship
    total_reward_received: BalanceOf<T>,

    // Total payout failed in this relationship
    total_reward_missed: BalanceOf<T>,
}

decl_storage! {
    trait Store for Module<T: Trait> as RecurringReward {

    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn on_finalize(now: T::BlockNumber) {}
    }
}

impl<T: Trait> Module<T> {}
