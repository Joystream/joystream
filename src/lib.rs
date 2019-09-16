// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Decode, Encode};
use srml_support::{decl_module, decl_storage, ensure, StorageMap, StorageValue};

use minting::{self, BalanceOf, MintId};
use system;

/// Type of identifier for recipients.
type RecipientId = u64;
pub const FIRST_RECIPIENT_ID: RecipientId = 1;

/// Type for identifier for relationship representing that a recipient recieves recurring reward from a token mint
type RewardRelationshipId = u64;
pub const FIRST_REWARD_RELATIONSHIP_ID: RewardRelationshipId = 1;

pub trait Trait: system::Trait + minting::Trait + Sized {
    type PayoutStatusHandler: PayoutStatusHandler<Self>;
}

/// Handler for aftermath of a payout attempt
pub trait PayoutStatusHandler<T: Trait> {
    fn payout_succeeded(
        id: RewardRelationshipId,
        destination_account: T::AccountId,
        amount: BalanceOf<T>,
    );

    fn payout_failed(
        id: RewardRelationshipId,
        destination_account: T::AccountId,
        amount: BalanceOf<T>,
    );
}

// A recipient of recurring rewards
#[derive(Encode, Decode, Copy, Clone, Debug, Default)]
pub struct Recipient<Balance> {
    // stats
    // Total payout received by this recipient
    total_reward_received: Balance,

    // Total payout missed for this recipient
    total_reward_missed: Balance,
}

#[derive(Encode, Decode, Copy, Clone, Debug, Default)]
pub struct RewardRelationship<AccountId, Balance, BlockNumber> {
    // Identifier for receiver
    recipient: RecipientId,

    // Identifier for reward source
    mint_id: MintId,

    // Destination account for reward
    account: AccountId,

    // Paid out for
    amount_per_payout: Balance,

    // When set, identifies block when next payout should be processed,
    // otherwise there is no pending payout
    next_payment_in_block: Option<BlockNumber>,

    // When set, will be the basis for automatically setting next payment,
    // otherwise any upcoming payout will be a one off.
    payout_interval: Option<BlockNumber>,

    // stats
    // Total payout received in this relationship
    total_reward_received: Balance,

    // Total payout failed in this relationship
    total_reward_missed: Balance,
}

decl_storage! {
    trait Store for Module<T: Trait> as RecurringReward {
        Recipients get(rewards): map RecipientId => Recipient<BalanceOf<T>>;

        NextRecipientId get(next_recipient_id): RecipientId = FIRST_RECIPIENT_ID;

        RewardRelationships get(reward_relationships): map RewardRelationshipId => RewardRelationship<T::AccountId, BalanceOf<T>, T::BlockNumber>;

        NextRewardRelationshipId get(next_reward_relationship_id): RewardRelationshipId = FIRST_REWARD_RELATIONSHIP_ID;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn on_finalize(now: T::BlockNumber) {}
    }
}

impl<T: Trait> Module<T> {}
