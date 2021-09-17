mod types;
use sp_std::borrow::ToOwned;
pub use types::*;

use crate::*;

impl<T: Trait> Module<T> {
    /// Authorize nft owner
    pub(crate) fn authorize_nft_owner(
        origin: T::Origin,
        actor: &ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
        video: &Video<T>,
    ) -> DispatchResult {
        ensure_actor_authorized_to_create_channel::<T>(origin, actor)?;

        // The nft owner will be..
        let content_owner = Self::actor_to_nft_owner(&actor)?;

        video.ensure_nft_ownership::<T>(&content_owner)
    }

    /// Check whether nft auction expired
    pub(crate) fn is_nft_auction_expired(auction: &Auction<T>) -> bool {
        if let AuctionType::English(round_duration) = auction.auction_type {
            let now = <frame_system::Module<T>>::block_number();

            // Check whether auction round time expired.
            (now - auction.starts_at) >= round_duration
        } else {
            // Open auction never expires
            false
        }
    }

    /// Ensure nft auction not expired
    pub(crate) fn ensure_nft_auction_not_expired(auction: &Auction<T>) -> DispatchResult {
        ensure!(
            !Self::is_nft_auction_expired(auction),
            Error::<T>::NFTAuctionIsAlreadyExpired
        );
        Ok(())
    }

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

    /// Ensure channel reward_account account is set
    pub(crate) fn ensure_reward_account_is_set(channel_id: T::ChannelId) -> DispatchResult {
        Self::channel_by_id(channel_id)
            .reward_account
            .ok_or(Error::<T>::RewardAccountIsNotSet)?;
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
    pub fn ensure_sufficient_free_balance(
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
    pub fn ensure_can_buy_now(
        video: &Video<T>,
        participant_account_id: &T::AccountId,
    ) -> DispatchResult {
        if let Some(OwnedNFT {
            transactional_status: TransactionalStatus::BuyNow(price),
            ..
        }) = &video.nft_status
        {
            Self::ensure_sufficient_free_balance(participant_account_id, *price)
        } else {
            Err(Error::<T>::NFTNotInBuyNowState.into())
        }
    }

    /// Ensure new pending offer for given participant is available to proceed
    pub fn ensure_new_pending_offer_available_to_proceed(
        video: &Video<T>,
        participant: T::MemberId,
        participant_account_id: &T::AccountId,
    ) -> DispatchResult {
        match &video.nft_status {
            Some(OwnedNFT {
                transactional_status: TransactionalStatus::InitiatedOfferToMember(to, price),
                ..
            }) if participant == *to => {
                if let Some(price) = price {
                    Self::ensure_sufficient_free_balance(participant_account_id, *price)?;
                }
            }
            _ => return Err(Error::<T>::NoIncomingTransfers.into()),
        }
        Ok(())
    }

    /// Buy nft
    pub fn buy_now(
        mut video: Video<T>,
        owner_account_id: T::AccountId,
        new_owner_account_id: T::AccountId,
        new_owner: T::MemberId,
    ) -> Video<T> {
        if let Some(OwnedNFT {
            transactional_status: TransactionalStatus::BuyNow(price),
            ref mut owner,
            ..
        }) = &mut video.nft_status
        {
            T::Currency::slash(&new_owner_account_id, *price);

            T::Currency::deposit_creating(&owner_account_id, *price);

            *owner = NFTOwner::Member(new_owner);
        }

        video.set_idle_transactional_status()
    }

    /// Completes nft offer
    pub fn complete_nft_offer(
        mut video: Video<T>,
        owner_account_id: T::AccountId,
        new_owner_account_id: T::AccountId,
    ) -> Video<T> {
        if let Some(OwnedNFT {
            transactional_status: TransactionalStatus::InitiatedOfferToMember(to, price),
            ref mut owner,
            ..
        }) = &mut video.nft_status
        {
            if let Some(price) = price {
                T::Currency::slash(&new_owner_account_id, *price);

                T::Currency::deposit_creating(&owner_account_id, *price);
            }

            *owner = NFTOwner::Member(*to);
        }

        video.set_idle_transactional_status()
    }

    /// Complete nft transfer
    pub(crate) fn complete_nft_auction_transfer(
        video: &mut Video<T>,
        auction_fee: BalanceOf<T>,
        last_bidder_account_id: T::AccountId,
        last_bidder: T::MemberId,
        owner_account_id: T::AccountId,
        last_bid_amount: BalanceOf<T>,
    ) {
        if let Some(OwnedNFT {
            owner,
            transactional_status,
            creator_royalty,
            ..
        }) = &mut video.nft_status
        {
            if let Some(creator_royalty) = creator_royalty {
                let royalty = *creator_royalty * last_bid_amount;

                // Slash last bidder bid
                T::Currency::slash_reserved(&last_bidder_account_id, last_bid_amount);

                // Deposit bid, exluding royalty amount and auction fee into auctioneer account
                if last_bid_amount > royalty + auction_fee {
                    T::Currency::deposit_creating(
                        &owner_account_id,
                        last_bid_amount - royalty - auction_fee,
                    );
                } else {
                    T::Currency::deposit_creating(&owner_account_id, last_bid_amount - auction_fee);
                }

                // Should always be Some(_) at this stage, because of previously made check.
                if let Some(creator_account_id) =
                    Self::channel_by_id(video.in_channel).reward_account
                {
                    // Deposit royalty into creator account
                    T::Currency::deposit_creating(&creator_account_id, royalty);
                }
            } else {
                // Slash last bidder bid and deposit it into auctioneer account
                T::Currency::slash_reserved(&last_bidder_account_id, last_bid_amount);

                // Deposit bid, exluding auction fee into auctioneer account
                T::Currency::deposit_creating(&owner_account_id, last_bid_amount - auction_fee);
            }

            *owner = NFTOwner::Member(last_bidder);
            *transactional_status = TransactionalStatus::Idle;
        }
    }

    /// Complete auction
    pub(crate) fn complete_auction(
        mut video: Video<T>,
        last_bidder_account_id: T::AccountId,
        owner_account_id: T::AccountId,
    ) -> Video<T> {
        if let Some(OwnedNFT {
            transactional_status: TransactionalStatus::Auction(auction),
            ..
        }) = &video.nft_status
        {
            let auction = auction.to_owned();
            if let Some(last_bid) = auction.last_bid {
                let bid = last_bid.amount;
                let last_bidder = last_bid.bidder;
                let auction_fee = Self::auction_fee_percentage() * bid;

                Self::complete_nft_auction_transfer(
                    &mut video,
                    auction_fee,
                    last_bidder_account_id,
                    last_bidder,
                    owner_account_id,
                    bid,
                );
            }
        }
        video
    }
}
