mod types;
use sp_std::borrow::ToOwned;
pub use types::*;

use crate::*;

impl<T: Trait> Module<T> {
    /// Ensure nft auction can be completed
    pub(crate) fn ensure_auction_can_be_completed(auction: &Auction<T>) -> DispatchResult {
        let can_be_completed = if let AuctionType::English(EnglishAuctionDetails {
            auction_duration,
            ..
        }) = auction.auction_type
        {
            let now = <frame_system::Module<T>>::block_number();

            // Check whether auction time expired.
            (now - auction.starts_at) >= auction_duration
        } else {
            // Open auction can be completed at any time
            true
        };

        ensure!(can_be_completed, Error::<T>::AuctionCannotBeCompleted);

        Ok(())
    }

    /// Ensure auction participant has sufficient balance to make bid
    pub(crate) fn ensure_has_sufficient_balance(
        participant: &T::AccountId,
        bid: CurrencyOf<T>,
    ) -> DispatchResult {
        ensure!(
            T::Currency::can_reserve(participant, bid),
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Safety/bound checks for auction parameters
    pub(crate) fn validate_auction_params(
        auction_params: &AuctionParams<T::BlockNumber, CurrencyOf<T>, T::MemberId>,
    ) -> DispatchResult {
        match auction_params.auction_type {
            AuctionType::English(EnglishAuctionDetails {
                extension_period,
                auction_duration,
            }) => {
                Self::ensure_auction_duration_bounds_satisfied(auction_duration)?;
                Self::ensure_extension_period_bounds_satisfied(extension_period)?;

                // Ensure auction_duration of English auction is >= extension_period
                ensure!(
                    auction_duration >= extension_period,
                    Error::<T>::ExtensionPeriodIsGreaterThenAuctionDuration
                );
            }
            AuctionType::Open(OpenAuctionDetails { bid_lock_duration }) => {
                Self::ensure_bid_lock_duration_bounds_satisfied(bid_lock_duration)?;
            }
        }

        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;
        Self::ensure_bid_step_bounds_satisfied(auction_params.minimal_bid_step)?;
        Self::ensure_whitelist_bounds_satisfied(&auction_params.whitelist)?;

        if let Some(starts_at) = auction_params.starts_at {
            Self::ensure_starts_at_delta_bounds_satisfied(starts_at)?;
        }

        if let Some(buy_now_price) = auction_params.buy_now_price {
            ensure!(
                buy_now_price > auction_params.starting_price,
                Error::<T>::BuyNowIsLessThenStartingPrice
            );
        }

        Ok(())
    }

    /// Ensure starts at bounds satisfied
    pub(crate) fn ensure_starts_at_delta_bounds_satisfied(
        starts_at: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            starts_at >= <frame_system::Module<T>>::block_number(),
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
    pub(crate) fn ensure_bid_step_bounds_satisfied(bid_step: CurrencyOf<T>) -> DispatchResult {
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

    /// Ensure whitelist bounds satisfied
    pub(crate) fn ensure_whitelist_bounds_satisfied(
        whitelist: &BTreeSet<T::MemberId>,
    ) -> DispatchResult {
        match whitelist.len() {
            // whitelist is empty <==> feature is not active.
            0 => Ok(()),
            // auctions with one paticipant does not makes sense
            1 => Err(Error::<T>::WhitelistHasOnlyOneMember.into()),
            length => {
                ensure!(
                    length <= Self::max_auction_whitelist_length() as usize,
                    Error::<T>::MaxAuctionWhiteListLengthUpperBoundExceeded
                );
                Ok(())
            }
        }
    }

    /// Ensure auction duration bounds satisfied
    pub(crate) fn ensure_auction_duration_bounds_satisfied(
        duration: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            duration <= Self::max_auction_duration(),
            Error::<T>::AuctionDurationUpperBoundExceeded
        );
        ensure!(
            duration >= Self::min_auction_duration(),
            Error::<T>::AuctionDurationLowerBoundExceeded
        );

        Ok(())
    }

    /// Ensure auction extension period bounds satisfied
    pub(crate) fn ensure_extension_period_bounds_satisfied(
        extension_period: T::BlockNumber,
    ) -> DispatchResult {
        ensure!(
            extension_period <= Self::max_auction_extension_period(),
            Error::<T>::ExtensionPeriodUpperBoundExceeded
        );
        ensure!(
            extension_period >= Self::min_auction_extension_period(),
            Error::<T>::ExtensionPeriodLowerBoundExceeded
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
        starting_price: CurrencyOf<T>,
    ) -> DispatchResult {
        ensure!(
            starting_price >= Self::min_starting_price(),
            Error::<T>::StartingPriceLowerBoundExceeded
        );
        ensure!(
            starting_price <= Self::max_starting_price(),
            Error::<T>::StartingPriceUpperBoundExceeded
        );
        Ok(())
    }

    /// Ensure given participant have sufficient free balance
    pub(crate) fn ensure_sufficient_free_balance(
        participant_account_id: &T::AccountId,
        balance: CurrencyOf<T>,
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
        if let TransactionalStatus::<T>::BuyNow(price) = &nft.transactional_status {
            Self::ensure_sufficient_free_balance(participant_account_id, *price)
        } else {
            Err(Error::<T>::NftNotInBuyNowState.into())
        }
    }

    /// Ensure new pending offer for given participant is available to proceed
    pub(crate) fn ensure_new_pending_offer_available_to_proceed(
        nft: &Nft<T>,
        participant_account_id: &T::AccountId,
    ) -> DispatchResult {
        if let TransactionalStatus::<T>::InitiatedOfferToMember(member_id, price) =
            &nft.transactional_status
        {
            // Authorize participant under given member id
            ensure_member_auth_success::<T>(participant_account_id, &member_id)?;

            if let Some(price) = price {
                Self::ensure_sufficient_free_balance(participant_account_id, *price)?;
            }
            Ok(())
        } else {
            Err(Error::<T>::PendingOfferDoesNotExist.into())
        }
    }

    /// Cancel Nft transaction
    pub fn cancel_transaction(nft: Nft<T>) -> Nft<T> {
        if let TransactionalStatus::<T>::Auction(ref auction) = nft.transactional_status {
            if let Some(ref last_bid) = auction.last_bid {
                // Unreserve previous bidder balance
                T::Currency::unreserve(&last_bid.bidder_account_id, last_bid.amount);
            }
        }

        nft.set_idle_transactional_status()
    }

    /// Buy nft
    pub(crate) fn buy_now(
        in_channel: T::ChannelId,
        mut nft: Nft<T>,
        owner_account_id: T::AccountId,
        new_owner_account_id: T::AccountId,
        new_owner: T::MemberId,
    ) -> Nft<T> {
        if let TransactionalStatus::<T>::BuyNow(price) = &nft.transactional_status {
            Self::complete_payment(
                in_channel,
                nft.creator_royalty,
                *price,
                new_owner_account_id,
                Some(owner_account_id),
                false,
            );

            nft.owner = NftOwner::Member(new_owner);
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
        if let TransactionalStatus::<T>::InitiatedOfferToMember(to, price) =
            &nft.transactional_status
        {
            if let Some(price) = price {
                Self::complete_payment(
                    in_channel,
                    nft.creator_royalty,
                    *price,
                    new_owner_account_id,
                    Some(owner_account_id),
                    false,
                );
            }

            nft.owner = NftOwner::Member(*to);
        }

        nft.set_idle_transactional_status()
    }

    /// Complete payment, either auction related or buy now/offer
    pub(crate) fn complete_payment(
        in_channel: T::ChannelId,
        creator_royalty: Option<Royalty>,
        amount: CurrencyOf<T>,
        sender_account_id: T::AccountId,
        receiver_account_id: Option<T::AccountId>,
        // for auction related payments
        is_auction: bool,
    ) {
        let auction_fee = Self::platform_fee_percentage() * amount;

        // Slash amount from sender
        if is_auction {
            T::Currency::slash_reserved(&sender_account_id, amount);
        } else {
            T::Currency::slash(&sender_account_id, amount);
        }

        if let Some(creator_royalty) = creator_royalty {
            let royalty = creator_royalty * amount;

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
        } else if let Some(receiver_account_id) = receiver_account_id {
            // Deposit amount, exluding auction fee into receiver account
            T::Currency::deposit_creating(&receiver_account_id, amount - auction_fee);
        }
    }

    /// Complete auction
    pub(crate) fn complete_auction(
        in_channel: T::ChannelId,
        mut nft: Nft<T>,
        last_bid: Bid<T::MemberId, T::AccountId, T::BlockNumber, CurrencyOf<T>>,
        owner_account_id: Option<T::AccountId>,
    ) -> Nft<T> {
        let last_bid_amount = last_bid.amount;
        let last_bidder = last_bid.bidder;
        let bidder_account_id = last_bid.bidder_account_id;

        Self::complete_payment(
            in_channel,
            nft.creator_royalty,
            last_bid_amount,
            bidder_account_id,
            owner_account_id,
            true,
        );

        nft.owner = NftOwner::Member(last_bidder);
        nft.transactional_status = TransactionalStatus::<T>::Idle;
        nft
    }
}
