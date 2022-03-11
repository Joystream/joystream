mod types;
use sp_std::borrow::ToOwned;
pub use types::*;

use crate::*;

impl<T: Trait> Module<T> {
    /// Ensure nft auction can be completed
    pub(crate) fn ensure_auction_can_be_completed(auction: &Auction<T>) -> DispatchResult {
        let can_be_completed =
            if let AuctionTypeOf::<T>::English(EnglishAuction::<T> { end, duration, .. }) =
                auction.auction_type
            {
                let now = <frame_system::Module<T>>::block_number();

                // Check whether auction time expired.
                now >= end.saturating_sub(duration)
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
            T::Currency::total_balance(participant) >= bid,
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    /// Safety/bound checks for auction parameters
    pub(crate) fn validate_auction_params(auction_params: &AuctionParams<T>) -> DispatchResult {
        match auction_params.auction_type {
            AuctionTypeOf::<T>::English(EnglishAuction::<T> {
                extension_period,
                duration,
                min_bid_step,
                ..
            }) => {
                Self::ensure_auction_duration_bounds_satisfied(duration)?;
                Self::ensure_extension_period_bounds_satisfied(extension_period)?;

                Self::ensure_bid_step_bounds_satisfied(min_bid_step.unwrap_or_default())?;

                // Ensure auction_duration of English auction is >= extension_period
                ensure!(
                    duration >= extension_period,
                    Error::<T>::ExtensionPeriodIsGreaterThenAuctionDuration
                );
            }
            AuctionTypeOf::<T>::Open(OpenAuction::<T> {
                bid_lock_duration, ..
            }) => {
                Self::ensure_bid_lock_duration_bounds_satisfied(bid_lock_duration)?;
            }
        }

        Self::ensure_starting_price_bounds_satisfied(auction_params.starting_price)?;

        Self::ensure_whitelist_bounds_satisfied(&auction_params.whitelist)?;

        if let Some(buy_now_price) = auction_params.buy_now_price {
            ensure!(
                buy_now_price > auction_params.starting_price,
                Error::<T>::BuyNowIsLessThenStartingPrice
            );
        }

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

        Nft::<T> {
            transactional_status: TransactionalStatus::<T>::Idle,
            ..nft
        }
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

        Nft::<T> {
            transactional_status: TransactionalStatus::<T>::Idle,
            ..nft
        }
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

    /// Complete auction, assumptions:
    /// 1. video.nft_status.is_some()
    /// 2. matches!(video.nft_status, TransactionalStatus::<T>::Auction)
    pub(crate) fn complete_auction(
        video_id: T::VideoId,
        winner_id: T::MemberId,
    ) -> Result<Nft<T>, DispatchError> {
        let Video::<T> {
            in_channel,
            nft_status,
            ..
        } = Self::video_by_id(video_id);
        let nft = nft_status.unwrap();

        let auction = Self::ensure_auction_state(&nft)?;
        let bid_amount = match auction.auction_type {
            AuctionTypeOf::<T>::English(eng) => eng.top_bid.unwrap().amount,
            AuctionTypeOf::<T>::Open(_) => Self::bid_by_video_by_member(video_id, winner_id).amount,
        };

        let dest_account_id = Self::ensure_owner_account_id(in_channel, &nft)?;
        let src_account_id = T::MemberAuthenticator::controller_account_id(winner_id)?;

        Self::complete_payment(
            in_channel,
            nft.creator_royalty,
            bid_amount,
            src_account_id,
            Some(dest_account_id),
            true,
        );

        Ok(Self::cancel_transaction(&nft, Some(winner_id)))
    }

    pub(crate) fn cancel_transaction(nft: &Nft<T>, winner: Option<T::MemberId>) -> Nft<T> {
        // set owner & idle transactional status
        Nft::<T> {
            owner: winner.map_or(nft.owner.to_owned(), |winner_id| {
                NftOwner::Member(winner_id)
            }),
            creator_royalty: nft.creator_royalty,
            transactional_status: TransactionalStatus::<T>::Idle,
            open_auctions_nonce: nft.open_auctions_nonce,
        }
    }

    // fetches the desginated nft owner account, preconditions:
    // 1. Self::ensure_channel_exist(channel_id).is_ok()
    pub(crate) fn ensure_owner_account_id(
        channel_id: T::ChannelId,
        nft: &Nft<T>,
    ) -> Result<T::AccountId, DispatchError> {
        match nft.owner {
            NftOwner::Member(member_id) => T::MemberAuthenticator::controller_account_id(member_id),
            NftOwner::ChannelOwner => Self::channel_by_id(channel_id)
                .reward_account
                .ok_or_else(|| Error::<T>::RewardAccountIsNotSet.into()),
        }
    }

    pub(crate) fn ensure_whitelisted_participant(
        auction: &Auction<T>,
        participant_id: T::MemberId,
    ) -> DispatchResult {
        ensure!(
            auction.whitelist.is_empty() || auction.whitelist.contains(&participant_id),
            Error::<T>::MemberIsNotAllowedToParticipate
        );
        Ok(())
    }

    pub(crate) fn ensure_auction_can_be_canceled(auction: &Auction<T>) -> DispatchResult {
        Self::ensure_auction_has_no_bids(auction)
    }

    pub(crate) fn ensure_auction_has_no_bids(auction: &Auction<T>) -> DispatchResult {
        match &auction.auction_type {
            AuctionTypeOf::<T>::English(eng) => {
                ensure!(eng.top_bid.is_none(), Error::<T>::ActionHasBidsAlready)
            }
            AuctionTypeOf::<T>::Open(open) => {
                ensure!(open.bids == 0, Error::<T>::ActionHasBidsAlready)
            }
        }
        Ok(())
    }

    pub(crate) fn ensure_auction_has_valid_bids(auction: &Auction<T>) -> DispatchResult {
        Self::ensure_auction_has_no_bids(auction)
            .map_or_else(|_| Ok(()), |_| Err(Error::<T>::BidDoesNotExist.into()))
    }

    pub(crate) fn ensure_nft_auction_not_expired(
        nft: &Nft<T>,
    ) -> Result<Auction<T>, DispatchError> {
        let now = <frame_system::Module<T>>::block_number();
        if let TransactionalStatus::<T>::Auction(auction) = &nft.transactional_status {
            match &auction.auction_type {
                AuctionTypeOf::<T>::English(eng) => {
                    ensure!(eng.end > now, Error::<T>::NftAuctionIsAlreadyExpired,)
                }
                AuctionTypeOf::<T>::Open(open) => ensure!(
                    nft.open_auctions_nonce == open.auction_id,
                    Error::<T>::NftAuctionIsAlreadyExpired,
                ),
            }
            Ok(auction.to_owned())
        } else {
            Err(Error::<T>::NotInAuctionState.into())
        }
    }

    pub(crate) fn ensure_bid_can_be_made(
        auction: &Auction<T>,
        member_id: T::MemberId,
        amount: CurrencyOf<T>,
        video_id: T::VideoId,
    ) -> DispatchResult {
        // 1. if bid >= Some(buy_now) -> Ok(())
        if let Some(buy_now) = &auction.buy_now_price {
            if amount > *buy_now {
                return Ok(());
            }
        }

        match &auction.auction_type {
            AuctionTypeOf::<T>::English(eng) => eng.top_bid.clone().map_or_else(
                || {
                    ensure!(
                        auction.starting_price <= amount,
                        Error::<T>::StartingPriceConstraintViolated,
                    );
                    Ok(())
                },
                |bid| {
                    ensure!(
                        bid.amount
                            .saturating_add(eng.min_bid_step.unwrap_or_default())
                            <= amount,
                        Error::<T>::BidStepConstraintViolated
                    );
                    Ok(())
                },
            ),
            AuctionTypeOf::<T>::Open(open) => Self::ensure_open_bid_exists(video_id, member_id)
                .map_or_else(
                    |_| {
                        ensure!(
                            auction.starting_price <= amount,
                            Error::<T>::StartingPriceConstraintViolated,
                        );
                        Ok(())
                    },
                    |bid| {
                        // ensure lock duration if offer is lower
                        if amount < bid.amount {
                            Self::ensure_bid_lock_duration_expired(&open, bid.made_at_block)
                        } else {
                            Ok(())
                        }
                    },
                ),
        }
    }

    pub(crate) fn ensure_bid_lock_duration_expired(
        open_auction: &OpenAuction<T>,
        last_bid_block: <T as frame_system::Trait>::BlockNumber,
    ) -> DispatchResult {
        let now = <frame_system::Module<T>>::block_number();
        ensure!(
            last_bid_block.saturating_add(open_auction.bid_lock_duration) >= now,
            Error::<T>::BidLockDurationIsNotExpired
        );
        Ok(())
    }

    pub(crate) fn ensure_nft_exists(video_id: T::VideoId) -> Result<Nft<T>, Error<T>> {
        Self::ensure_video_exists(&video_id).and_then(|video| video.ensure_nft_is_issued::<T>())
    }

    /// Ensure bid can be cancelled
    pub fn ensure_bid_can_be_canceled(
        who: T::MemberId,
        nft_video_id: T::VideoId,
    ) -> DispatchResult {
        let nft = Self::ensure_nft_exists(nft_video_id)?;
        let bid = Self::ensure_open_bid_exists(nft_video_id, who)?;

        match nft.transactional_status {
            TransactionalStatus::<T>::Auction(Auction::<T> {
                auction_type: AuctionTypeOf::<T>::Open(open),
                ..
            }) if open.auction_id == bid.auction_id => {
                Self::ensure_bid_lock_duration_expired(&open, bid.made_at_block)
            }
            _ => Ok(()),
        }
    }

    // NFT
    /// Get nft auction record
    pub(crate) fn ensure_auction_state(nft: &Nft<T>) -> Result<Auction<T>, DispatchError> {
        if let TransactionalStatus::<T>::Auction(auction) = &nft.transactional_status {
            Ok(auction.to_owned())
        } else {
            Err(Error::<T>::NotInAuctionState.into())
        }
    }

    ///  Ensure nft transactional status is set to `Idle`
    pub(crate) fn ensure_nft_transactional_status_is_idle(nft: &Nft<T>) -> DispatchResult {
        if let TransactionalStatus::<T>::Idle = nft.transactional_status {
            Ok(())
        } else {
            Err(Error::<T>::NftIsNotIdle.into())
        }
    }

    /// Ensure Nft has pending offer
    pub(crate) fn ensure_pending_offer_state(nft: &Nft<T>) -> DispatchResult {
        ensure!(
            matches!(
                nft.transactional_status,
                TransactionalStatus::<T>::InitiatedOfferToMember(..),
            ),
            Error::<T>::PendingOfferDoesNotExist
        );
        Ok(())
    }

    /// Ensure Nft is in BuyNow state
    pub(crate) fn ensure_buy_now_state(nft: &Nft<T>) -> DispatchResult {
        ensure!(
            matches!(
                nft.transactional_status,
                TransactionalStatus::<T>::BuyNow(..),
            ),
            Error::<T>::NftNotInBuyNowState
        );
        Ok(())
    }

    pub fn ensure_is_open_auction(auction: &Auction<T>) -> Result<OpenAuction<T>, DispatchError> {
        if let AuctionTypeOf::<T>::Open(open) = &auction.auction_type {
            Ok(open.clone())
        } else {
            Err(Error::<T>::IsNotOpenAuctionType.into())
        }
    }

    pub fn ensure_is_english_auction(
        auction: &Auction<T>,
    ) -> Result<EnglishAuction<T>, DispatchError> {
        if let AuctionTypeOf::<T>::English(english) = &auction.auction_type {
            Ok(english.clone())
        } else {
            Err(Error::<T>::IsNotEnglishAuctionType.into())
        }
    }
}
