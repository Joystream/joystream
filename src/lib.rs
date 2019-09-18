// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Decode, Encode};
use runtime_primitives::traits::Zero;
use srml_support::{decl_module, decl_storage, ensure, StorageMap, StorageValue};

use minting::{self, BalanceOf, MintId};
use system;

mod mock;
mod tests;

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
        destination_account: &T::AccountId,
        amount: BalanceOf<T>,
    );

    fn payout_failed(
        id: RewardRelationshipId,
        destination_account: &T::AccountId,
        amount: BalanceOf<T>,
    );
}

impl<T: Trait> PayoutStatusHandler<T> for () {
    fn payout_succeeded(
        _id: RewardRelationshipId,
        _destination_account: &T::AccountId,
        _amount: BalanceOf<T>,
    ) {
    }

    fn payout_failed(
        _id: RewardRelationshipId,
        _destination_account: &T::AccountId,
        _amount: BalanceOf<T>,
    ) {
    }
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
    next_payment_at_block: Option<BlockNumber>,

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
        Recipients get(recipients): map RecipientId => Recipient<BalanceOf<T>>;

        NextRecipientId get(next_recipient_id): RecipientId = FIRST_RECIPIENT_ID;

        RewardRelationships get(reward_relationships): map RewardRelationshipId => RewardRelationship<T::AccountId, BalanceOf<T>, T::BlockNumber>;

        NextRewardRelationshipId get(next_reward_relationship_id): RewardRelationshipId = FIRST_REWARD_RELATIONSHIP_ID;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn on_finalize(now: T::BlockNumber) {
            Self::do_payouts(now);
        }
    }
}

#[derive(Eq, PartialEq, Debug)]
pub enum RewardsError {
    RecipientNotFound,
    RewardSourceNotFound,
    BlockNumberInPast,
    RewardRelationshipNotFound,
}

pub enum NextPaymentSchedule<BlockNumber> {
    Absolute(BlockNumber),
    Relative(BlockNumber),
}

impl<T: Trait> Module<T> {
    /* Adds a new Recipient recipient to recipients, with identifier equal to nextRecipientId, which is also incremented, and returns the new recipient identifier. */
    pub fn add_recipient() -> RecipientId {
        let next_id = Self::next_recipient_id();
        NextRecipientId::mutate(|n| {
            *n += 1;
        });
        <Recipients<T>>::insert(&next_id, Recipient::default());
        next_id
    }

    /// Removes a mapping from reward_recipients based on the given identifier.
    pub fn remove_recipient(id: RecipientId) {
        <Recipients<T>>::remove(&id);
    }

    // Adds a new RewardRelationship to rewardRelationships, for a given source, recipient, account, etc., with identifier equal to current nextRewardRelationshipId. Also increments nextRewardRelationshipId.
    pub fn add_reward_relationship(
        mint_id: MintId,
        recipient: RecipientId,
        account: T::AccountId,
        amount_per_payout: BalanceOf<T>,
        next_payment_schedule: Option<NextPaymentSchedule<T::BlockNumber>>,
        payout_interval: Option<T::BlockNumber>,
    ) -> Result<RewardRelationshipId, RewardsError> {
        ensure!(
            <minting::Module<T>>::mint_exists(mint_id),
            RewardsError::RewardSourceNotFound
        );

        let next_payment_at_block = match next_payment_schedule {
            Some(schedule) => match schedule {
                NextPaymentSchedule::Absolute(blocknumber) => {
                    ensure!(
                        blocknumber > <system::Module<T>>::block_number(),
                        RewardsError::BlockNumberInPast
                    );
                    Some(blocknumber)
                }
                NextPaymentSchedule::Relative(blocknumber) => {
                    Some(<system::Module<T>>::block_number() + blocknumber)
                }
            },
            None => match payout_interval {
                Some(interval) => Some(<system::Module<T>>::block_number() + interval),
                None => {
                    // No payouts will be made unless relationship is updated in future and next_payment_in_block
                    // is set! should this be allowed?
                    None
                }
            },
        };

        let relationship = RewardRelationship {
            mint_id,
            recipient,
            account,
            amount_per_payout,
            next_payment_at_block,
            payout_interval,
            total_reward_received: Zero::zero(),
            total_reward_missed: Zero::zero(),
        };

        let relationship_id = Self::next_reward_relationship_id();
        NextRewardRelationshipId::mutate(|n| {
            *n += 1;
        });
        <RewardRelationships<T>>::insert(relationship_id, relationship);
        Ok(relationship_id)
    }

    // Removes a mapping from reward relashionships based on given identifier.
    pub fn remove_reward_relationship(id: RewardRelationshipId) {
        <RewardRelationships<T>>::remove(&id);
    }

    // For reward relationship found with given identifier, new values can be set for
    // account, payout, block number when next payout will be made and the new interval after
    // the next scheduled payout. All values are optional, but updating values are combined in this
    // single method to ensure atomic updates.
    pub fn set_reward_relationship(
        id: RewardRelationshipId,
        account: Option<T::AccountId>,
        payout: Option<BalanceOf<T>>,
        next_payment_at: Option<Option<T::BlockNumber>>,
        payout_interval: Option<Option<T::BlockNumber>>,
    ) -> Result<(), RewardsError> {
        ensure!(
            <RewardRelationships<T>>::exists(&id),
            RewardsError::RewardRelationshipNotFound
        );
        let mut relationship = Self::reward_relationships(&id);

        if let Some(account) = account {
            relationship.account = account;
        }
        if let Some(payout) = payout {
            relationship.amount_per_payout = payout;
        }
        if let Some(next_payout_at_block) = next_payment_at {
            if let Some(blocknumber) = next_payout_at_block {
                ensure!(
                    blocknumber > <system::Module<T>>::block_number(),
                    RewardsError::BlockNumberInPast
                );
            }
            relationship.next_payment_at_block = next_payout_at_block;
        }
        if let Some(payout_interval) = payout_interval {
            relationship.payout_interval = payout_interval;
        }
        <RewardRelationships<T>>::insert(&id, relationship);
        Ok(())
    }

    /*
    For all relationships where next_payment_at_block is set and matches current block height,
    a call to pay_reward is made for the suitable amount, recipient and source.
    The next_payment_in_block is updated based on payout_interval.
    If the call succeeds, total_reward_received is incremented on both
    recipient and dependency with amount_per_payout, and a call to T::PayoutStatusHandler is made.
    Otherwise, analogous steps for failure.
    */
    fn do_payouts(now: T::BlockNumber) {
        for relationship_id in FIRST_REWARD_RELATIONSHIP_ID..Self::next_reward_relationship_id() {
            if !<RewardRelationships<T>>::exists(&relationship_id) {
                continue;
            }
            let mut relationship = Self::reward_relationships(&relationship_id);

            // recipient can be removed independantly of relationship, so ensure we have a recipient
            if !<Recipients<T>>::exists(&relationship.recipient) {
                continue;
            }
            let mut recipient = Self::recipients(&relationship.recipient);

            if let Some(blocknumber) = relationship.next_payment_at_block {
                if blocknumber != now {
                    return;
                }

                // Add the missed payout and try to pay those in addition to scheduled payout?
                // let payout = relationship.total_reward_missed + relationship.amount_per_payout;
                let payout = relationship.amount_per_payout;

                // try to make payment
                if <minting::Module<T>>::transfer_exact_tokens(
                    relationship.mint_id,
                    payout,
                    &relationship.account,
                )
                .is_err()
                {
                    // add only newly scheduled payout to total missed payout
                    relationship.total_reward_missed += relationship.amount_per_payout;

                    // update recipient stats
                    recipient.total_reward_missed += relationship.amount_per_payout;

                    T::PayoutStatusHandler::payout_failed(
                        relationship_id,
                        &relationship.account,
                        payout,
                    );
                } else {
                    // update payout received stats
                    relationship.total_reward_received += payout;
                    recipient.total_reward_received += payout;

                    // update missed payout stats
                    // if relationship.total_reward_missed != Zero::zero() {
                    //     // update recipient stats
                    //     recipient.total_reward_missed -= relationship.total_reward_missed;

                    //     // clear missed reward on relationship
                    //     relationship.total_reward_missed = Zero::zero();
                    // }
                    T::PayoutStatusHandler::payout_succeeded(
                        relationship_id,
                        &relationship.account,
                        payout,
                    );
                }

                // update next payout blocknumber at interval if set
                if let Some(payout_interval) = relationship.payout_interval {
                    relationship.next_payment_at_block = Some(now + payout_interval);
                } else {
                    relationship.next_payment_at_block = None;
                }

                // update relationship and recipient to storage
                <Recipients<T>>::insert(&relationship.recipient, recipient);
                <RewardRelationships<T>>::insert(&relationship_id, relationship);
            }
        }
    }
}
