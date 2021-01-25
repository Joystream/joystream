// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(test)]
pub(crate) mod tests;

use frame_support::{decl_event, decl_module, decl_storage, Parameter};
use frame_system::ensure_signed;
use sp_arithmetic::traits::Zero;
use sp_std::vec::Vec;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

pub trait Trait: frame_system::Trait + balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Bounty Id type
    type BountyId: From<u32> + Parameter + Default + Copy;
}

/*
Metadata: A standardised structure document describing user facing information, for example a title, amount requested, deliverable, discovery metadata, link to forum etc. Is not stored in storage, chain only sees raw extrinsic payload blob, like rationales before.
Oracle: Origin that will select winner(s), is either a given member or the council.
Cherry: An mount of funding, possibly 0, provided by the creator which will be split among all other contributors should the min funding bound not be reached. If reached, cherry is returned to the creator. When council is creating bounty, this comes out of their budget, when a member does it, it comes from an account.
Screened Entrants: The set of members who are allowed to submit their work, if not set, then it is open. Main use case for this is to model dominant assurance contract where member sets contribution cherry and him/herself sa only elidable worker.
Minimum Amount: The minimum total quantity of funds, possibly 0, required for the bounty to become available for people to work on.
Max Amount: Maximumm funding accepted, if this limit is reached, funding automatically is over.
Entrant Stake: Amount of stake required, possibly 0, to enter bounty as entrant.
Funding Period Length (Optional): Number of blocks from creation until funding is no longer possible. If not provided, then funding is called perpetual, and it only ends when minimum amount is reached.
Work Period Length: Number of blocks from end of funding period until people can no longer submit bounty submissions.
Judging Period Length: Number of block from end of work period until oracl can no longer decide winners.
*/

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct BountyCreationParameters<AccountId, Balance, BlockNumber> {
    pub metadata: Vec<u8>,

    pub oracle: AccountId,

    pub cherry: Balance,

    pub screened_entrants: Vec<u8>,

    pub min_amount: Balance,

    pub max_amount: Balance,

    pub funding_period: Option<BlockNumber>,

    pub work_period: BlockNumber,

    pub judging_period: BlockNumber,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Bounty<Balance> {
    pub cherry: Balance,
}

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

decl_storage! {
    trait Store for Module<T: Trait> as Bounty {
        /// Bounty storage
        pub Bounties get(fn bounties) : map hasher(blake2_128_concat) T::BountyId => Bounty<BalanceOf<T>>;

        /// Count of all bounties that have been created.
        pub BountyCount get(fn bounty_count): u32;
    }
}

decl_event! {
    pub enum Event<T>
    where
        <T as Trait>::BountyId,
    {
        BountyCreated(BountyId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        #[weight = 10_000_000] // TODO: adjust weight
        fn create_bounty(origin, params: BountyCreationParameters<T::AccountId, BalanceOf<T>, T::BlockNumber>) {
            ensure_signed(origin)?;

            let next_bounty_count_value = Self::bounty_count() + 1;
            let bounty_id = T::BountyId::from(next_bounty_count_value);

            let bounty = Bounty {
                cherry: Zero::zero()
            };

            //
            // == MUTATION SAFE ==
            //

            <Bounties<T>>::insert(bounty_id, bounty);
            BountyCount::mutate(|count| {
                *count = *count + 1
            });
            Self::deposit_event(RawEvent::BountyCreated(bounty_id));
        }
    }
}
