mod types;
use sp_std::borrow::ToOwned;
pub use types::*;

use crate::*;

impl<T: Trait> Module<T> {
    /// Ensure nft auction can be completed
    pub(crate) fn ensure_auction_can_be_completed(auction: &Auction<T>) -> DispatchResult {
        let can_be_completed = if let AuctionType::English(round_duration) = auction.auction_type {
            let now = <frame_system::Module<T>>::block_number();

            // Check whether auction round time expired.
            (now - auction.starts_at) >= round_duration
        } else {
            // Open auction can be completed at any time
            true
        };

        ensure!(can_be_completed, Error::<T>::AuctionCannotBeCompleted);

        Ok(())
    }

    /// Ensure
    pub(crate) fn ensure_actor_is_last_bidder(
        origin: T::Origin,
        member_id: MemberId<T>,
        auction: &Auction<T>,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        ensure_member_auth_success::<T>(&member_id, &account_id)?;

        auction.ensure_caller_is_last_bidder::<T>(member_id)
    }

    /// Ensure auction participant has sufficient balance to make bid
    pub(crate) fn ensure_has_sufficient_balance(
        participant: &T::AccountId,
        bid: BalanceOf<T>,
    ) -> DispatchResult {
        ensure!(
            T::Currency::can_reserve(participant, bid),
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Safety/bound checks for auction parameters
    pub(crate) fn validate_auction_params(
        auction_params: &AuctionParams<T::VideoId, T::BlockNumber, BalanceOf<T>, MemberId<T>>,
    ) -> DispatchResult {
        match auction_params.auction_type {
            AuctionType::English(round_duration) => {
                Self::ensure_round_duration_bounds_satisfied(round_duration)?;
            }
            AuctionType::Open(lock_duration) => {
                Self::ensure_bid_lock_duration_bounds_satisfied(lock_duration)?;
            }
        }

        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;
        Self::ensure_bid_step_bounds_satisfied(auction_params.minimal_bid_step)?;

        if let Some(starts_at) = auction_params.starts_at {
            Self::ensure_starts_at_delta_bounds_satisfied(starts_at)?;
        }

        Ok(())
    }

    /// Ensure starts at bounds satisfied
    pub(crate) fn ensure_starts_at_delta_bounds_satisfied(
        starts_at: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            starts_at > <frame_system::Module<T>>::block_number(),
            Error::<T>::StartsAtLowerBoundExceeded
        );

        ensure!(
            starts_at
                <= <frame_system::Module<T>>::block_number() + Self::auction_starts_at_max_delta(),
            Error::<T>::StartsAtUpperBoundExceeded
        );

        Ok(())
    }

    /// Ensure royalty bounds satisfied
    pub(crate) fn ensure_royalty_bounds_satisfied(royalty: Perbill) -> DispatchResult {
        ensure!(
            royalty <= Self::max_creator_royalty(),
            Error::<T>::RoyaltyUpperBoundExceeded
        );
        ensure!(
            royalty >= Self::min_creator_royalty(),
            Error::<T>::RoyaltyLowerBoundExceeded
        );
        Ok(())
    }

    /// Ensure bid step bounds satisfied
    pub(crate) fn ensure_bid_step_bounds_satisfied(bid_step: BalanceOf<T>) -> DispatchResult {
        ensure!(
            bid_step <= Self::max_bid_step(),
            Error::<T>::AuctionBidStepUpperBoundExceeded
        );
        ensure!(
            bid_step >= Self::min_bid_step(),
            Error::<T>::AuctionBidStepLowerBoundExceeded
        );
        Ok(())
    }

    /// Ensure auction duration bounds satisfied
    pub(crate) fn ensure_round_duration_bounds_satisfied(
        round_duration: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            round_duration <= Self::max_round_duration(),
            Error::<T>::RoundTimeUpperBoundExceeded
        );
        ensure!(
            round_duration >= Self::min_round_duration(),
            Error::<T>::RoundTimeLowerBoundExceeded
        );

        Ok(())
    }

    /// Ensure bid lock duration bounds satisfied
    pub(crate) fn ensure_bid_lock_duration_bounds_satisfied(
        bid_lock_duration: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            bid_lock_duration <= Self::max_bid_lock_duration(),
            Error::<T>::BidLockDurationUpperBoundExceeded
        );
        ensure!(
            bid_lock_duration >= Self::min_bid_lock_duration(),
            Error::<T>::BidLockDurationLowerBoundExceeded
        );
        Ok(())
    }

    /// Ensure royalty bounds satisfied
    pub(crate) fn ensure_starting_price_bounds_satisfied(
        starting_price: BalanceOf<T>,
    ) -> DispatchResult {
        ensure!(
            starting_price >= Self::max_starting_price(),
            Error::<T>::StartingPriceUpperBoundExceeded
        );
        ensure!(
            starting_price <= Self::min_starting_price(),
            Error::<T>::StartingPriceLowerBoundExceeded
        );
        Ok(())
    }

    /// Ensure given participant have sufficient free balance
    pub(crate) fn ensure_sufficient_free_balance(
        participant_account_id: &T::AccountId,
        balance: BalanceOf<T>,
    ) -> DispatchResult {
        ensure!(
            T::Currency::can_slash(participant_account_id, balance),
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Ensure given participant can buy nft now
    pub(crate) fn ensure_can_buy_now(
        nft: &Nft<T>,
        participant_account_id: &T::AccountId,
    ) -> DispatchResult {
        if let TransactionalStatus::BuyNow(price) = &nft.transactional_status {
            Self::ensure_sufficient_free_balance(participant_account_id, *price)
        } else {
            Err(Error::<T>::NFTNotInBuyNowState.into())
        }
    }

    /// Ensure new pending offer for given participant is available to proceed
    pub(crate) fn ensure_new_pending_offer_available_to_proceed(
        nft: &Nft<T>,
        participant: T::MemberId,
        participant_account_id: &T::AccountId,
    ) -> DispatchResult {
        match &nft.transactional_status {
            TransactionalStatus::InitiatedOfferToMember(to, price) if participant == *to => {
                if let Some(price) = price {
                    Self::ensure_sufficient_free_balance(participant_account_id, *price)?;
                }
                Ok(())
            }
            _ => Err(Error::<T>::NoIncomingTransfers.into()),
        }
    }

    /// Buy nft
    pub(crate) fn buy_now(
        mut nft: Nft<T>,
        owner_account_id: T::AccountId,
        new_owner_account_id: T::AccountId,
        new_owner: T::MemberId,
    ) -> Nft<T> {
        if let TransactionalStatus::BuyNow(price) = &nft.transactional_status {
            T::Currency::slash(&new_owner_account_id, *price);

            T::Currency::deposit_creating(&owner_account_id, *price);

            nft.owner = NFTOwner::Member(new_owner);
        }

        nft.set_idle_transactional_status()
    }

    /// Completes nft offer
    pub(crate) fn complete_nft_offer(
        in_channel: T::ChannelId,
        mut nft: Nft<T>,
        owner_account_id: T::AccountId,
        new_owner_account_id: T::AccountId,
    ) -> Nft<T> {
        if let TransactionalStatus::InitiatedOfferToMember(to, price) = &nft.transactional_status {
            if let Some(price) = price {
                Self::complete_payment(
                    in_channel,
                    nft.creator_royalty,
                    *price,
                    new_owner_account_id,
                    Some(owner_account_id),
                );
            }

            nft.owner = NFTOwner::Member(*to);
        }

        nft.set_idle_transactional_status()
    }

    /// Complete payment, either auction related or buy now
    pub(crate) fn complete_payment(
        in_channel: T::ChannelId,
        creator_royalty: Option<Royalty>,
        amount: BalanceOf<T>,
        sender_account_id: T::AccountId,
        receiver_account_id: Option<T::AccountId>,
    ) {
        let auction_fee = Self::platform_fee_percentage() * amount;

        if let Some(creator_royalty) = creator_royalty {
            let royalty = creator_royalty * amount;

            // Slash amount from sender
            T::Currency::slash_reserved(&sender_account_id, amount);

            // Deposit amount, exluding royalty and platform fee into receiver account
            match receiver_account_id {
                Some(receiver_account_id) if amount > royalty + auction_fee => {
                    T::Currency::deposit_creating(
                        &receiver_account_id,
                        amount - royalty - auction_fee,
                    );
                }
                Some(receiver_account_id) => {
                    T::Currency::deposit_creating(&receiver_account_id, amount - auction_fee);
                }
                _ => (),
            };

            // Should always be Some(_) at this stage, because of previously made check.
            if let Some(creator_account_id) = Self::channel_by_id(in_channel).reward_account {
                // Deposit royalty into creator account
                T::Currency::deposit_creating(&creator_account_id, royalty);
            }
        } else {
            // Slash amount from sender
            T::Currency::slash_reserved(&sender_account_id, amount);

            if let Some(receiver_account_id) = receiver_account_id {
                // Deposit amount, exluding auction fee into receiver account
                T::Currency::deposit_creating(&receiver_account_id, amount - auction_fee);
            }
        }
    }

    /// Complete auction
    pub(crate) fn complete_auction(
        in_channel: T::ChannelId,
        mut nft: Nft<T>,
        auction: Auction<T>,
        owner_account_id: Option<T::AccountId>,
    ) -> Nft<T> {
        if let Some(last_bid) = auction.last_bid {
            let last_bid_amount = last_bid.amount;
            let last_bidder = last_bid.bidder;
            let bidder_account_id = last_bid.bidder_account_id;

            Self::complete_payment(
                in_channel,
                nft.creator_royalty,
                last_bid_amount,
                bidder_account_id,
                owner_account_id,
            );

            nft.owner = NFTOwner::Member(last_bidder);
            nft.transactional_status = TransactionalStatus::Idle;
        }
        nft
    }
}
